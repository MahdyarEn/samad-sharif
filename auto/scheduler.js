import cron from "node-cron";
import { checkNewWeek } from "./checker.js";
import { getAutoReserveUsers, setLastReservedWeek } from "../db/index.js";
import { reserveForUsers } from "./reserver.js";
import { formatLastCheckedProgram, getSamadAccessToken } from "../utils/index.js";
import config from "../config.js";

let running = false;

async function notifyChannelWeekOpened(bot, weekStartDate) {
  if (!config.CHANNEL_ID) {
    console.log("[CRON] CHANNEL_ID not set, skip channel notify");
    return;
  }

  try {
    const me = await bot.getMe();
    const weekFa = formatLastCheckedProgram(weekStartDate);
    const text = `<tg-emoji emoji-id="5359678839591018693">🍽</tg-emoji> <b>رزرو غذای این هفته باز شد</b>

<tg-emoji emoji-id="5431897022456145283">📅</tg-emoji> شروع هفته: <code>${weekFa}</code>

<tg-emoji emoji-id="5776233299424843260">🔗</tg-emoji> سامانه سماد:
https://samad.app/

<tg-emoji emoji-id="5372981976804366741">🤖</tg-emoji> ربات: @${me.username}`;

    await bot.sendMessage(config.CHANNEL_ID, text, { parse_mode: "HTML", disable_web_page_preview: true });
    console.log("[CRON] channel notified ✅", config.CHANNEL_ID);
  } catch (e) {
    console.error("[CRON] channel notify failed:", e.message);
  }
}

export function startAutoReserve(pool, bot) {
  // cron.schedule("*/7 * * * *", async () => {
    
  // every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    console.log("[CRON] tick", new Date().toISOString());

    if (running) {
      console.log("[CRON] already running, skip");
      return;
    }
    running = true;

    try {
      const adminToken = await getSamadAccessToken(pool);
      const result = await checkNewWeek(pool, adminToken);

      if (!result) {
        console.log("[CRON] no new week yet");
        return;
      }

      console.log("[CRON] week:", result.weekStartDate, "isNewWeek:", result.isNewWeek);

      if (result.isNewWeek) {
        await notifyChannelWeekOpened(bot, result.weekStartDate);
      }

      const users = await getAutoReserveUsers(pool);
      console.log("[CRON] auto users:", users.length);
      await reserveForUsers(users, result.weekStartDate, pool, bot);

      if (result.isNewWeek) {
        await setLastReservedWeek(pool, result.weekStartDate);
      }

      console.log("[CRON] reservation done ✅");
    } catch (e) {
      console.error("[CRON] error:", e);
    } finally {
      running = false;
    }
  });
}
