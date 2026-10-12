import { fetchUserProfile, isInvalidToken, loginUser } from "../api/services.js";
import { getLoggedInUsers, saveSession } from "../db/index.js";
import { buildHomeKeyboard, normalizeArray, normalizeWaitSelves, SAMAD_SELVES } from "../utils/index.js";

const DELAY_MS = 400;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getProfileCredit(user, pool) {
  let token = user.access_token;
  let result = await fetchUserProfile(token).catch(() => null);

  if (!result || isInvalidToken(result)) {
    const login = await loginUser(user.username, user.password).catch(() => null);
    if (!login?.access_token) return null;
    await saveSession(pool, user.id, user.username, user.password, login);
    token = login.access_token;
    result = await fetchUserProfile(token).catch(() => null);
  }

  if (!result?.payload) return null;
  return Number(result.payload.credit) / 10;
}

function waitSelfTitles(waitSelves) {
  const ids = normalizeWaitSelves(waitSelves);
  const titles = SAMAD_SELVES.filter((s) => ids.includes(s.id)).map((s) => s.title);
  return titles.length ? titles.join("، ") : "سلف مرکزی / کاله";
}

function buildOffReminderText() {
  return `<tg-emoji emoji-id="5879813604068298387">⭕️</tg-emoji> <b>رزرو خودکار شما خاموش است</b>

این هفته برای شما رزرو انجام نمی‌شود.
اگر می‌خواهید ربات براتون رزرو کند، از تنظیمات رزرو خودکار را روشن کنید.`;
}

function buildOnReminderText({ creditToman, forceOn, waitTitles, dayCount, missingFoods, missingDays }) {
  const parts = [];

  if (missingFoods || missingDays) {
    const gaps = [];
    if (missingFoods) gaps.push("اولویت غذایی");
    if (missingDays) gaps.push("روزهای هفته");
    parts.push(
      `<tg-emoji emoji-id="5818705028424141605">⚙️</tg-emoji> <b>تنظیمات رزرو ناقص است</b>
رزرو خودکار روشن است، ولی ${gaps.join(" و ")} را انتخاب نکرده‌اید.
اگر می‌خواهید ربات براتون رزرو کند، از منوی اصلی تنظیمات را تکمیل کنید.`,
    );
    return parts.join("\n\n");
  }

  if (creditToman != null) {
    const creditLine = `موجودی کیف پول سماد شما <b>${creditToman.toLocaleString("fa-IR")}</b> تومان است.`;
    const hint =
      creditToman < 100_000
        ? "برای رزرو بدون مشکل، حساب سماد را شارژ کنید (پیشنهاد: حداقل ۱۰۰٬۰۰۰ تومان)."
        : "اگر فکر می‌کنید کافی نیست، حساب سماد را شارژ کنید.";
    parts.push(`<tg-emoji emoji-id="5212962322967966165">💳</tg-emoji> <b>موجودی سماد</b>\n${creditLine}\n${hint}`);
  }

  parts.push(
    `<tg-emoji emoji-id="5818705028424141605">⚙️</tg-emoji> <b>یادآوری تنظیمات رزرو</b>
• رزرو خودکار: <b>روشن</b>
• رزرو اجباری غذای روز: <b>${forceOn ? "روشن" : "خاموش"}</b>
• سلف‌های شروع رزرو: <b>${waitTitles}</b>
• تعداد روز رزرو در هفته: <b>${dayCount.toLocaleString("fa-IR")}</b> روز`,
  );

  return parts.join("\n\n");
}

export async function runWeeklyReminders(pool, bot) {
  const users = await getLoggedInUsers(pool);
  console.log("[REMIND] logged-in users:", users.length);

  let sent = 0;
  for (const user of users) {
    try {
      const autoOn = Number(user.auto_reserve) === 1;
      const forceOn = Number(user.force_reserve) === 1;
      const foods = normalizeArray(user.food_priority);
      const days = normalizeArray(user.days);

      let text;
      if (!autoOn) {
        text = buildOffReminderText();
      } else {
        const creditToman = await getProfileCredit(user, pool);
        text = buildOnReminderText({
          creditToman,
          forceOn,
          waitTitles: waitSelfTitles(user.wait_selves),
          dayCount: days.length,
          missingFoods: foods.length === 0,
          missingDays: days.length === 0,
        });
      }

      await bot.sendMessage(user.id, text, {
        parse_mode: "HTML",
        reply_markup: buildHomeKeyboard(true),
        disable_web_page_preview: true,
      });
      sent++;
    } catch (e) {
      console.error("[REMIND] user failed:", user.id, e.message);
    }
    await sleep(DELAY_MS);
  }

  console.log("[REMIND] done ✅ sent:", sent);
}
