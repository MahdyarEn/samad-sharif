import { getSelfWeekPrograms } from "../api/services.js";
import { getLastReservedWeek } from "../db/index.js";
import { getNextSaturday } from "../utils/index.js";

export async function checkNewWeek(pool, adminToken) {
  const nextWeekStart = getNextSaturday();
  const lastReservedWeek = await getLastReservedWeek(pool);

  try {
    const nextWeekRes = await getSelfWeekPrograms(adminToken, nextWeekStart);

    if (nextWeekRes?.status === 200) {
      return {
        weekStartDate: nextWeekStart,
        programs: nextWeekRes.data,
        isNewWeek: true,
      };
    }
  } catch (e) {}

  if (lastReservedWeek) {
    try {
      const currentWeekRes = await getSelfWeekPrograms(adminToken, lastReservedWeek);

      if (currentWeekRes?.status === 200) {
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
