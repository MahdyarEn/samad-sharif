import cron from "node-cron";
import config from "../config.js";
import { buildDailyMenuRichMessage, DAILY_MENU_SELVES, fetchDailyMenu, getDailyMenuDates } from "../utils/daily-menu.js";
import { sendRichMessage } from "../utils/index.js";

export function isDailyMenuTime(now) {
  const { date } = getDailyMenuDates(now);
  const day = new Date(`${date}T00:00:00Z`).getUTCDay();
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Tehran", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const minutes = Number(parts.find((p) => p.type === "hour").value) * 60 + Number(parts.find((p) => p.type === "minute").value);
  return day !== 4 && day !== 5 && minutes >= 630;
}

export function createDailyMenuTick(pool, bot, { channelId = config.CHANNEL_ID, fetchMenu = fetchDailyMenu, send = sendRichMessage, clock = () => new Date() } = {}) {
  let running = false;
  let sentDate;
  return async (now = new Date()) => {
    if (!channelId || running || !isDailyMenuTime(now)) return;
    const { date } = getDailyMenuDates(now);
    if (sentDate === date) return;
    running = true;
    try {
      const [rows] = await pool.query("SELECT value FROM system_state WHERE `key` = ?", ["channel_daily_menu_date"]);
      if (rows[0]?.value === date) {
        sentDate = date;
        return;
      }
      const menu = await fetchMenu(pool, now, bot);
      if (menu.date !== date || DAILY_MENU_SELVES.some((self) => !Array.isArray(menu.bySelf[self.id]))) {
        throw new Error("Daily menu incomplete; retry on next tick");
      }
      // Avoid publishing yesterday's report if a request crossed midnight.
      if (getDailyMenuDates(clock()).date !== date) return;
      await send(bot, channelId, buildDailyMenuRichMessage(date, menu.bySelf));
      sentDate = date;
      await pool.query("REPLACE INTO system_state (`key`, value) VALUES (?, ?)", ["channel_daily_menu_date", date]);
    } catch (error) {
      console.error("[DAILY_MENU]", error.message);
    } finally {
      running = false;
    }
  };
}

export function startDailyMenu(pool, bot) {
  const tick = createDailyMenuTick(pool, bot);
  // First attempt at 10:30 Tehran; retry every five minutes until sent today.
  return cron.schedule("*/5 * * * *", () => tick(), { timezone: "Asia/Tehran" });
}
