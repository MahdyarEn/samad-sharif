import cron from "node-cron";
import { checkNewWeek } from "./checker.js";
import { getAutoReserveUsers, getChannelNotifiedSelves, setChannelNotifiedSelves, setLastReservedWeek } from "../db/index.js";
import { reserveForUsers } from "./reserver.js";
import { formatLastCheckedProgram, getSamadAccessToken, isWeekMenuReady, SAMAD_SELVES } from "../utils/index.js";
import { getSelfWeekPrograms } from "../api/services.js";
import config from "../config.js";

let running = false;

async function notifyNewlyOpenedSelves(bot, weekStartDate, adminToken, pool) {
  if (!config.CHANNEL_ID) {
    console.log("[CRON] CHANNEL_ID not set, skip channel notify");
    return;
  }

  const notified = await getChannelNotifiedSelves(pool, weekStartDate);
  const notifiedSet = new Set(notified);
  const weekFa = formatLastCheckedProgram(weekStartDate);
  let me;
  try {
    me = await bot.getMe();
  } catch (e) {
    console.error("[CRON] getMe failed:", e.message);
    return;
  }

  for (const self of SAMAD_SELVES) {
    if (notifiedSet.has(self.id)) continue;

    try {
      const res = await getSelfWeekPrograms(adminToken, weekStartDate, self.id);
      if (res?.status !== 200 || !isWeekMenuReady(res.data)) continue;

      const text = `<tg-emoji emoji-id="5359678839591018693">🍽</tg-emoji> سلف «<b>${self.title}</b>» باز شد

<tg-emoji emoji-id="5431897022456145283">📅</tg-emoji> هفته: <code>${weekFa}</code>

<tg-emoji emoji-id="5776233299424843260">🔗</tg-emoji> سامانه سماد:
https://samad.app/

<tg-emoji emoji-id="5372981976804366741">🤖</tg-emoji> ربات: @${me.username}`;

      await bot.sendMessage(config.CHANNEL_ID, text, { parse_mode: "HTML", disable_web_page_preview: true });
      notifiedSet.add(self.id);
      await setChannelNotifiedSelves(pool, weekStartDate, [...notifiedSet]);
      console.log("[CRON] channel self opened ✅", self.id, self.title);
    } catch (e) {
      console.error("[CRON] channel self notify failed:", self.id, e.message);
    }
  }
}

export function startAutoReserve(pool, bot) {
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
        console.log("[CRON] no ready week yet");
        return;
      }

      console.log("[CRON] week:", result.weekStartDate, "isNewWeek:", result.isNewWeek);

      await notifyNewlyOpenedSelves(bot, result.weekStartDate, adminToken, pool);

      const users = await getAutoReserveUsers(pool);
      console.log("[CRON] auto users:", users.length);
      await reserveForUsers(users, result.weekStartDate, pool, bot, adminToken);

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
