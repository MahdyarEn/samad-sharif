import { getSelfWeekPrograms, loginUser, reserveFood } from "../api/services.js";
import { clearReserveError, logoutUser, markReserveError, saveSession, setUserLastCheckedProgram } from "../db/index.js";
import { buildHomeKeyboard, normalizeArray, normalizeFoodName, sleep } from "../utils/index.js";

const CONCURRENCY = 5;

function isAlreadyReservedError(messageFa = "") {
  return (
    messageFa === "با توجه به قواعد و محدودیتها، هیچ موردی برای تغییر وجود ندارد." ||
    messageFa === "شما 2 مورد انتخاب کرده اید در حالیکه حداکثر باید 1 مورد انتخاب کنید."
  );
}

async function tryReserveProgram(user, program, day, bot) {
  console.log(`[RESERVE] try user=${user.id} day=${day.title} food=${program.foodName}`);
  const res = await reserveFood(user, program);
  console.log(res);

  if (res?.type === "ERROR") {
    if (isAlreadyReservedError(res?.messageFa)) {
      console.log(`[RESERVE] user=${user.id} day=${day.title} already reserved, next day`);
      return { done: true, success: false, already: true, messageFa: res.messageFa };
    }
    return { done: false, success: false, messageFa: res.messageFa || res.message || "خطای نامشخص" };
  }

  console.log(`[RESERVE] OK user=${user.id} day=${day.title} food=${program.foodName}`);
  bot.sendMessage(
    user.id,
    `✅ غذای روز <b>${day.title}</b> با موفقیت رزرو شد.

نام غذا: ${program.foodName}
هزینه غذا: ${Number(program.price / 10).toLocaleString()} تومان`,
    { parse_mode: "HTML" }
  );
  return { done: true, success: true };
}

async function reserveForUser(user, weekStartDate, pool, bot) {
  if (!user?.username) return;

  let hasError = false;
  let touchedAnyDay = false;

  try {
    let apiResult = await getSelfWeekPrograms(user?.access_token, weekStartDate);
    if (apiResult?.data?.error_description == "Invalid access token") {
      const resalt = await loginUser(user.username, user.password);
      if (resalt?.access_token) {
        await saveSession(pool, user.id, user.username, user.password, resalt);
        user.access_token = resalt.access_token;
      }
      apiResult = await getSelfWeekPrograms(resalt?.access_token, weekStartDate);
    }
    if (apiResult?.data?.error_description == "Invalid access token") {
      await logoutUser(pool, user.id);
      bot.sendMessage(user.id, `⭕️ رزرو غذا در سماد با خطا مواجد شد\nشما رمز اکانت خود را عوض کردید، لطفا مجددا در ربات لاگین کنید`, {
        reply_markup: buildHomeKeyboard(false),
        parse_mode: "HTML",
      });
      return;
    }
    if (!apiResult?.data?.payload?.selfWeekPrograms || !Array.isArray(apiResult.data.payload.selfWeekPrograms)) {
      return;
    }

    const allPrograms = apiResult.data.payload.selfWeekPrograms.flat().filter(Boolean);
    console.log(`AutoReserve user ${user.id}`);

    const uDays = normalizeArray(user?.days);
    const uFoods = normalizeArray(user?.food_priority);
    const forceReserve = !!user?.force_reserve;

    for (let dayIndex = 0; dayIndex < uDays.length; dayIndex++) {
      const day = uDays[dayIndex];
      const isLastDay = dayIndex === uDays.length - 1;
      const dayPrograms = allPrograms.filter((p) => p.dayTranslated === day.english);
      if (dayPrograms.length === 0) {
        console.log(`[RESERVE] user=${user.id} day=${day.title} no programs, skip`);
        continue;
      }

      touchedAnyDay = true;
      let dayDone = false;
      let lastFailMessage = null;
      let triedAnyPriority = false;
      const triedProgramIds = new Set();

      for (const food of uFoods) {
        const program = dayPrograms.find((p) => normalizeFoodName(p?.foodName) === normalizeFoodName(food?.title));
        if (!program) continue;

        triedAnyPriority = true;
        triedProgramIds.add(program.programId);
        const result = await tryReserveProgram(user, program, day, bot);

        if (result.done) {
          dayDone = true;
          if (result.already) {
            const nextHint = isLastDay ? "" : "\nدر حال رفتن به روز بعد…";
            bot.sendMessage(
              user.id,
              `ℹ️ رزرو غذا برای روز <b>${day.title}</b>\n<blockquote>${result.messageFa || "رزرو غذای این روز از قبل انجام شده است"}</blockquote>${nextHint}`,
              { parse_mode: "HTML" }
            );
          }
          break;
        }
        lastFailMessage = result.messageFa;
        console.log(`[RESERVE] fail user=${user.id} day=${day.title} food=${program.foodName} → next priority`);
        await sleep(100);
      }

      if (!dayDone && forceReserve) {
        const fallbackPrograms = dayPrograms.filter((p) => !triedProgramIds.has(p.programId));
        for (let i = fallbackPrograms.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [fallbackPrograms[i], fallbackPrograms[j]] = [fallbackPrograms[j], fallbackPrograms[i]];
        }

        for (const program of fallbackPrograms) {
          const result = await tryReserveProgram(user, program, day, bot);
          if (result.done) {
            dayDone = true;
            if (result.already) {
              const nextHint = isLastDay ? "" : "\nدر حال رفتن به روز بعد…";
              bot.sendMessage(
                user.id,
                `ℹ️ رزرو غذا برای روز <b>${day.title}</b>\n<blockquote>${result.messageFa || "رزرو غذای این روز از قبل انجام شده است"}</blockquote>${nextHint}`,
                { parse_mode: "HTML" }
              );
            }
            break;
          }
          lastFailMessage = result.messageFa;
          console.log(`[RESERVE] force-fail user=${user.id} day=${day.title} food=${program.foodName} → next`);
          await sleep(100);
        }
      }

      if (!dayDone) {
        hasError = true;
        const detail =
          !triedAnyPriority && !forceReserve
            ? `<blockquote>هیچ‌کدام از اولویت‌های غذایی شما در منوی این روز نبود.</blockquote>`
            : lastFailMessage
              ? `<blockquote>${lastFailMessage}</blockquote>`
              : `<blockquote>رزرو انجام نشد.</blockquote>`;
        const nextHint = isLastDay ? "" : "\nدر حال رفتن به روز بعد…";
        bot.sendMessage(user.id, `⭕️ رزرو غذا برای روز <b>${day.title}</b> انجام نشد\n${detail}${nextHint}`, {
          parse_mode: "HTML",
        });
      }

      await sleep(100);
    }

    if (touchedAnyDay) {
      await setUserLastCheckedProgram(user.id, weekStartDate, pool);
    }
  } catch (e) {
    hasError = true;
    console.error(`[AUTO] ERROR user=${user.id}`, e);
  }

  if (hasError) {
    await markReserveError(user.id, pool);
  } else {
    await clearReserveError(user.id, pool);
  }
}

export async function reserveForUsers(users, weekStartDate, pool, bot) {
  const list = users.filter((u) => u?.username);
  console.log(`[RESERVE] start users=${list.length} concurrency=${CONCURRENCY}`);

  for (let i = 0; i < list.length; i += CONCURRENCY) {
    const chunk = list.slice(i, i + CONCURRENCY);
    console.log(`[RESERVE] batch ${Math.floor(i / CONCURRENCY) + 1} size=${chunk.length} ids=${chunk.map((u) => u.id).join(",")}`);
    await Promise.all(chunk.map((user) => reserveForUser(user, weekStartDate, pool, bot)));
    if (i + CONCURRENCY < list.length) {
      await sleep(300);
    }
  }
}
