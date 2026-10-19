import { fetchUserProfile, getSelfWeekPrograms, isBadCredentials, isInvalidToken, loginUser, reserveFood } from "../api/services.js";
import { getPendingReserveDays, logoutUser, saveSession, setUserLastCheckedProgram, touchReservedDay } from "../db/index.js";
import {
  areSelvesReady,
  buildHomeKeyboard,
  flattenWeekPrograms,
  getReserveSelfIds,
  getSelfIdsForFood,
  normalizeArray,
  normalizeFoodName,
  resolveWaitSelves,
  isPriorityUser,
  sleep,
} from "../utils/index.js";

const CONCURRENCY = 5;
const MAX_DAY_ATTEMPTS = 3;
const BAD_PASSWORD_MSG = `<tg-emoji emoji-id="5879813604068298387">⭕️</tg-emoji> ورود به سماد با رمز ذخیره‌شده ممکن نشد.

رمز عبور سماد اشتباه است؛ لطفا دوباره در ربات لاگین کنید.`;

function sortUsersByReservePriority(users) {
  return [...users].sort((a, b) => {
    const ap = isPriorityUser(a.id) ? 0 : 1;
    const bp = isPriorityUser(b.id) ? 0 : 1;
    if (ap !== bp) return ap - bp;
    return new Date(a.created_at || 0) - new Date(b.created_at || 0);
  });
}

function isClosedOrAlreadyError(messageFa = "") {
  return messageFa === "با توجه به قواعد و محدودیتها، هیچ موردی برای تغییر وجود ندارد." || messageFa === "شما 2 مورد انتخاب کرده اید در حالیکه حداکثر باید 1 مورد انتخاب کنید.";
}

function isFoodFullError(messageFa = "") {
  return String(messageFa).startsWith("غذاهای ذیل تا حداکثر سقف ممکن توسط کاربران رزرو شده اند");
}

async function tryReserveProgram(user, program, day, bot) {
  console.log(`[RESERVE] try user=${user.id} day=${day.title} food=${program.foodName} selfId=${program.selfId ?? "?"}`);
  const res = await reserveFood(user, program);
  console.log(res);

  if (res?.type === "ERROR") {
    const messageFa = res?.messageFa || res?.message || "خطای نامشخص";
    if (isClosedOrAlreadyError(messageFa)) {
      console.log(`[RESERVE] user=${user.id} day=${day.title} closed/already, skip day`);
      return { done: true, kind: "closed", messageFa };
    }
    if (isFoodFullError(messageFa)) {
      console.log(`[RESERVE] user=${user.id} day=${day.title} full food=${program.foodName} → next`);
      return { done: false, kind: "full", messageFa };
    }
    return { done: false, kind: "fail", messageFa };
  }

  console.log(`[RESERVE] OK user=${user.id} day=${day.title} food=${program.foodName}`);
  bot.sendMessage(
    user.id,
    `<tg-emoji emoji-id="5843528161278562947">✅</tg-emoji> غذای روز <b>${day.title}</b> با موفقیت رزرو شد.

نام غذا: ${program.foodName}
هزینه غذا: ${Number(program.price / 10).toLocaleString()} تومان`,
    { parse_mode: "HTML" },
  );
  return { done: true, kind: "success" };
}

async function detectUserGender(token) {
  const profile = await fetchUserProfile(token);
  if (isInvalidToken(profile)) {
    const err = new Error("Invalid access token");
    err.code = "INVALID_TOKEN";
    throw err;
  }
  return profile?.payload?.user?.gender || "مرد";
}

async function fetchProgramsBySelf(token, weekStartDate, gender) {
  const bySelf = {};
  for (const selfId of getReserveSelfIds(gender)) {
    const res = await getSelfWeekPrograms(token, weekStartDate, selfId);
    if (isInvalidToken(res?.data)) {
      const err = new Error("Invalid access token");
      err.code = "INVALID_TOKEN";
      throw err;
    }
    bySelf[selfId] = flattenWeekPrograms(res?.data)
      .filter((p) => p.hideInPanel === false)
      .map((p) => ({ ...p, selfId }));
  }
  return bySelf;
}

async function reserveForUser(user, weekStartDate, pool, bot) {
  if (!user?.username) return;

  try {
    let gender = user.gender;
    let bySelf;
    try {
      if (!gender) gender = await detectUserGender(user?.access_token);
      bySelf = await fetchProgramsBySelf(user?.access_token, weekStartDate, gender);
    } catch (e) {
      if (e.code !== "INVALID_TOKEN") throw e;

      let resalt;
      try {
        resalt = await loginUser(user.username, user.password);
      } catch (loginErr) {
        console.error(`[AUTO] login unavailable user=${user.id}`, loginErr?.message || loginErr);
        return;
      }

      if (resalt?.access_token) {
        await saveSession(pool, user.id, user.username, user.password, resalt);
        user.access_token = resalt.access_token;
        gender = await detectUserGender(resalt.access_token);
        user.gender = gender;
        bySelf = await fetchProgramsBySelf(resalt.access_token, weekStartDate, gender);
      } else if (isBadCredentials(resalt)) {
        await logoutUser(pool, user.id);
        bot.sendMessage(user.id, BAD_PASSWORD_MSG, {
          reply_markup: buildHomeKeyboard(false),
          parse_mode: "HTML",
        });
        return;
      } else {
        console.error(`[AUTO] login unexpected user=${user.id}`, resalt);
        return;
      }
    }

    const allPrograms = Object.values(bySelf).flat();
    if (allPrograms.length === 0) {
      console.log(`[RESERVE] user=${user.id} gender=${gender} no visible programs across selves, skip`);
      return;
    }
    console.log(`AutoReserve user ${user.id} gender=${gender} mainSelf=${getReserveSelfIds(gender)[0]} programs=${allPrograms.length}`);

    const uDays = getPendingReserveDays(user, weekStartDate);
    const uFoods = normalizeArray(user?.food_priority);
    const forceReserve = !!user?.force_reserve;

    if (!uDays.length) {
      console.log(`[RESERVE] user=${user.id} no pending days for week=${String(weekStartDate).slice(0, 10)}, skip`);
      await setUserLastCheckedProgram(user.id, weekStartDate, pool);
      return;
    }

    for (let dayIndex = 0; dayIndex < uDays.length; dayIndex++) {
      const day = uDays[dayIndex];
      const isLastDay = dayIndex === uDays.length - 1;
      const dayProgramsAll = allPrograms.filter((p) => p.dayTranslated === day.english);
      if (dayProgramsAll.length === 0) {
        console.log(`[RESERVE] user=${user.id} day=${day.title} not open yet, retry later`);
        continue;
      }

      const { attempt, state: bumped } = await touchReservedDay(user.id, weekStartDate, day.english, pool, { bump: true });
      user.reserved_days = bumped;
      const attemptLabel = `تلاش ${attempt.toLocaleString("fa-IR")} از ${MAX_DAY_ATTEMPTS.toLocaleString("fa-IR")}`;
      let dayDone = false;
      let dayNeedsRetry = false;
      let lastFailMessage = null;
      let triedAnyPriority = false;
      let onlyFullOrMissing = true;
      const triedProgramIds = new Set();

      for (const food of uFoods) {
        const selfIds = getSelfIdsForFood(food?.title, gender);
        let program = null;
        for (const selfId of selfIds) {
          const dayPrograms = (bySelf[selfId] || []).filter((p) => p.dayTranslated === day.english);
          program = dayPrograms.find((p) => normalizeFoodName(p?.foodName) === normalizeFoodName(food?.title));
          if (program) break;
        }
        if (!program) continue;

        triedAnyPriority = true;
        triedProgramIds.add(program.programId);
        const result = await tryReserveProgram(user, program, day, bot);

        if (result.kind === "full") {
          bot.sendMessage(
            user.id,
            `<tg-emoji emoji-id="5881702736843511327">⚠️</tg-emoji> غذای <b>${program.foodName}</b> برای روز <b>${day.title}</b> پر بود.
در حال امتحان اولویت بعدی…`,
            { parse_mode: "HTML" },
          );
          await sleep(100);
          continue;
        }

        if (result.done) {
          dayDone = true;
          if (result.kind === "closed") {
            const nextHint = isLastDay ? "" : "\nدر حال رفتن به روز بعد…";
            bot.sendMessage(user.id, `<tg-emoji emoji-id="5879501875341955281">ℹ️</tg-emoji> روز <b>${day.title}</b>: مهلت رزرو گذشته یا رزروی قابل تغییر نیست.${nextHint}`, { parse_mode: "HTML" });
          }
          break;
        }

        onlyFullOrMissing = false;
        lastFailMessage = result.messageFa;
        console.log(`[RESERVE] fail user=${user.id} day=${day.title} food=${program.foodName} → next priority`);
        await sleep(100);
      }

      if (!dayDone && forceReserve) {
        const fallbackPrograms = dayProgramsAll.filter((p) => !triedProgramIds.has(p.programId));
        for (let i = fallbackPrograms.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [fallbackPrograms[i], fallbackPrograms[j]] = [fallbackPrograms[j], fallbackPrograms[i]];
        }

        for (const program of fallbackPrograms) {
          const result = await tryReserveProgram(user, program, day, bot);

          if (result.kind === "full") {
            bot.sendMessage(
              user.id,
              `<tg-emoji emoji-id="5881702736843511327">⚠️</tg-emoji> غذای <b>${program.foodName}</b> برای روز <b>${day.title}</b> پر بود.
در حال امتحان گزینه بعدی…`,
              { parse_mode: "HTML" },
            );
            await sleep(100);
            continue;
          }

          if (result.done) {
            dayDone = true;
            if (result.kind === "closed") {
              const nextHint = isLastDay ? "" : "\nدر حال رفتن به روز بعد…";
              bot.sendMessage(user.id, `<tg-emoji emoji-id="5879501875341955281">ℹ️</tg-emoji> روز <b>${day.title}</b>: مهلت رزرو گذشته یا رزروی قابل تغییر نیست.${nextHint}`, { parse_mode: "HTML" });
            }
            break;
          }

          onlyFullOrMissing = false;
          lastFailMessage = result.messageFa;
          console.log(`[RESERVE] force-fail user=${user.id} day=${day.title} food=${program.foodName} → next`);
          await sleep(100);
        }
      }

      if (!dayDone) {
        const detail =
          !triedAnyPriority && !forceReserve
            ? `<blockquote>هیچ‌کدام از اولویت‌های غذایی شما در منوی این روز نبود.</blockquote>`
            : lastFailMessage && !onlyFullOrMissing
              ? `<blockquote>${lastFailMessage}</blockquote>`
              : `<blockquote>همه گزینه‌های قابل رزرو پر بودند یا در دسترس نبودند.</blockquote>`;

        if (!onlyFullOrMissing && triedAnyPriority && attempt < MAX_DAY_ATTEMPTS) {
          dayNeedsRetry = true;
        }

        const retryHint = dayNeedsRetry
          ? `\nدوباره تلاش می‌شود (${attemptLabel}).`
          : attempt >= MAX_DAY_ATTEMPTS && triedAnyPriority && !onlyFullOrMissing
            ? `\n${attemptLabel}: دیگر برای این روز تلاش نمی‌شود.`
            : "";
        const nextHint = isLastDay ? "" : "\nدر حال رفتن به روز بعد…";
        bot.sendMessage(
          user.id,
          `<tg-emoji emoji-id="5879813604068298387">⭕️</tg-emoji> رزرو غذا برای روز <b>${day.title}</b> انجام نشد
<code>${attemptLabel}</code>
${detail}${retryHint}${nextHint}`,
          { parse_mode: "HTML" },
        );
      }

      if (dayDone || !dayNeedsRetry) {
        const { state } = await touchReservedDay(user.id, weekStartDate, day.english, pool, { done: true });
        user.reserved_days = state;
        console.log(`[RESERVE] user=${user.id} day=${day.title} marked done success=${dayDone} attempt=${attempt}`);
      }

      await sleep(100);
    }

    if (!getPendingReserveDays(user, weekStartDate).length) {
      await setUserLastCheckedProgram(user.id, weekStartDate, pool);
    } else {
      console.log(`[RESERVE] user=${user.id} partial week, pending remain, retry later`);
    }
  } catch (e) {
    console.error(`[AUTO] ERROR user=${user.id}`, e?.code || "", e?.message || e);
  }
}

export async function reserveForUsers(users, weekStartDate, pool, bot, adminToken) {
  const list = sortUsersByReservePriority(users.filter((u) => u?.username));
  console.log(`[RESERVE] start users=${list.length} concurrency=${CONCURRENCY} (priority first, then created_at)`);

  const readyCache = new Map();
  async function userSelvesReady(user, gender, pendingDays) {
    const ids = resolveWaitSelves(user.wait_selves, gender);
    const days = pendingDays.map((d) => d?.english).filter(Boolean);
    if (!days.length) return false;
    const key = `${gender}:${ids
      .slice()
      .sort((a, b) => a - b)
      .join(",")}:${days.slice().sort().join(",")}`;
    if (readyCache.has(key)) return readyCache.get(key);
    const token = adminToken || user.access_token;
    if (!token) return true;
    const ok = await areSelvesReady(token, weekStartDate, ids, days);
    readyCache.set(key, ok);
    return ok;
  }

  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const chunk = list.slice(i, i + CONCURRENCY);
    console.log(`[RESERVE] batch ${Math.floor(i / CONCURRENCY) + 1} size=${chunk.length} ids=${chunk.map((u) => u.id).join(",")}`);
    await Promise.all(
      chunk.map(async (user) => {
        const pendingDays = getPendingReserveDays(user, weekStartDate);
        if (!pendingDays.length) {
          console.log(`[RESERVE] user=${user.id} already complete for week, skip`);
          return;
        }

        let gender = "مرد";
        try {
          gender = await detectUserGender(user.access_token);
        } catch (e) {
          if (e.code === "INVALID_TOKEN") {
            const resalt = await loginUser(user.username, user.password);
            if (resalt?.access_token) {
              await saveSession(pool, user.id, user.username, user.password, resalt);
              user.access_token = resalt.access_token;
              gender = await detectUserGender(user.access_token);
            }
          }
        }
        user.gender = gender;

        const ready = await userSelvesReady(user, gender, pendingDays);
        if (!ready) {
          console.log(
            `[RESERVE] user=${user.id} gender=${gender} wait_selves not ready selves=[${resolveWaitSelves(user.wait_selves, gender).join(",")}] pending=[${pendingDays.map((d) => d.english).join(",")}], skip`,
          );
          return;
        }
        return reserveForUser(user, weekStartDate, pool, bot);
      }),
    );
    if (i + CONCURRENCY < list.length) {
      await sleep(300);
    }
  }
}
