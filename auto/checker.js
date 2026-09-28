import { getSelfWeekPrograms } from "../api/services.js";
import { getLastReservedWeek } from "../db/index.js";
import { getNextSaturday, isWeekMenuReady } from "../utils/index.js";

function sameWeek(a, b) {
  if (!a || !b) return false;
  return String(a).slice(0, 10) === String(b).slice(0, 10);
}

export async function checkNewWeek(pool, adminToken) {
  const nextWeekStart = getNextSaturday();
  const lastReservedWeek = await getLastReservedWeek(pool);

  try {
    const nextWeekRes = await getSelfWeekPrograms(adminToken, nextWeekStart);

    if (nextWeekRes?.status === 200) {
      if (!isWeekMenuReady(nextWeekRes.data)) {
        console.log("[CHECK] next week exists but still hidden in panel, wait");
        return null;
      }
      return {
        weekStartDate: nextWeekStart,
        programs: nextWeekRes.data,
        isNewWeek: !sameWeek(lastReservedWeek, nextWeekStart),
      };
    }
  } catch (e) {}

  if (lastReservedWeek) {
    try {
      const currentWeekRes = await getSelfWeekPrograms(adminToken, lastReservedWeek);

      if (currentWeekRes?.status === 200) {
        if (!isWeekMenuReady(currentWeekRes.data)) {
          console.log("[CHECK] last reserved week menu hidden in panel, wait");
          return null;
        }
        return {
          weekStartDate: lastReservedWeek,
          programs: currentWeekRes.data,
          isNewWeek: false,
        };
      }
    } catch (e) {}
  }

  return null;
}
