import { fetchUserProfile, loginUser } from "../api/services.js";
import { getLoggedInUsers, saveSession } from "../db/index.js";
import { buildHomeKeyboard, normalizeArray } from "../utils/index.js";

const DELAY_MS = 400;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getProfileCredit(user, pool) {
  let token = user.access_token;
  let result = await fetchUserProfile(token).catch(() => null);

  if (!result || result?.error_description === "Invalid access token") {
    const login = await loginUser(user.username, user.password).catch(() => null);
    if (!login?.access_token) return null;
    await saveSession(pool, user.id, user.username, user.password, login);
    token = login.access_token;
    result = await fetchUserProfile(token).catch(() => null);
  }

  if (!result?.payload) return null;
  return Number(result.payload.credit) / 10;
}

function buildReminderText({ creditToman, missingFoods, missingDays }) {
  const parts = [];

  if (creditToman != null && creditToman < 100_000) {
    parts.push(
      `<tg-emoji emoji-id="5212962322967966165">💳</tg-emoji> <b>یادآوری شارژ سماد</b>\nموجودی کیف پول شما <b>${creditToman.toLocaleString("fa-IR")}</b> تومان است.\nبرای رزرو بدون مشکل، حساب سماد را شارژ کنید (پیشنهاد: حداقل ۱۰۰٬۰۰۰ تومان).`,
    );
  }

  if (missingFoods || missingDays) {
    const gaps = [];
    if (missingFoods) gaps.push("اولویت غذایی");
    if (missingDays) gaps.push("روزهای هفته");
    parts.push(
      `<tg-emoji emoji-id="5818705028424141605">⚙️</tg-emoji> <b>تنظیمات رزرو ناقص است</b>\nرزرو خودکار روشن است، ولی ${gaps.join(" و ")} را انتخاب نکرده‌اید.\nاگر می‌خواهید ربات براتون رزرو کند، از منوی اصلی تنظیمات را تکمیل کنید.`,
    );
  }

  if (!parts.length) return null;
  return parts.join("\n\n");
}

export async function runWeeklyReminders(pool, bot) {
  const users = await getLoggedInUsers(pool);
  console.log("[REMIND] logged-in users:", users.length);

  let sent = 0;
  for (const user of users) {
    try {
      const creditToman = await getProfileCredit(user, pool);
      const autoOn = Number(user.auto_reserve) === 1;
      const foods = normalizeArray(user.food_priority);
      const days = normalizeArray(user.days);

      const text = buildReminderText({
        creditToman,
        missingFoods: autoOn && foods.length === 0,
        missingDays: autoOn && days.length === 0,
      });

      if (!text) continue;

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
