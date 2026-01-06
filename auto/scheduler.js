import cron from "node-cron";
import { checkNewWeek } from "./checker.js";
import { getAutoReserveUsers, setLastReservedWeek } from "../db/index.js";
import { reserveForUsers } from "./reserver.js";
import { getSamadAccessToken } from "../utils/index.js";

let running = false;

export function startAutoReserve(pool, bot) {
  cron.schedule("*/7 * * * *", async () => {
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
      }
      console.log("[CRON] new week detected:", result?.weekStartDate);
      const users = await getAutoReserveUsers(pool);
      console.log("[CRON] auto users:", users.length);
      await reserveForUsers(users, result?.weekStartDate, pool, bot);
      if (result.isNewWeek) await setLastReservedWeek(pool, result?.weekStartDate);
      console.log("[CRON] reservation done ✅");
    } catch (e) {
      console.error("[CRON] error:", e);
    } finally {
      running = false;
    }
  });
}
