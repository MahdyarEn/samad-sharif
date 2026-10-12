import { getSelfWeekPrograms } from "../api/services.js";
import { getLastReservedWeek } from "../db/index.js";
import { getNextSaturday, isSelfOpenedInPanel } from "../utils/index.js";

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
      if (!isSelfOpenedInPanel(nextWeekRes.data)) {
        console.log("[CHECK] next week still closed in panel, wait");
        return null;
      }
      return {
        weekStartDate: nextWeekStart,
        isNewWeek: !sameWeek(lastReservedWeek, nextWeekStart),
      };
    }
  } catch (e) {}

  if (lastReservedWeek) {
    try {
      const currentWeekRes = await getSelfWeekPrograms(adminToken, lastReservedWeek);

      if (currentWeekRes?.status === 200) {
        if (!isSelfOpenedInPanel(currentWeekRes.data)) {
          console.log("[CHECK] last reserved week still closed in panel, wait");
          return null;
        }
        return {
          weekStartDate: lastReservedWeek,
          isNewWeek: false,
        };
      }
    } catch (e) {}
  }

  return null;
}
