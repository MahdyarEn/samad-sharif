import { getSelfWeekPrograms } from "../api/services.js";
import { getLastReservedWeek } from "../db/index.js";
import { getNextSaturday, isSelfOpenedInPanel, SAMAD_SELVES } from "../utils/index.js";

export function sameWeek(a, b) {
  if (!a || !b) return false;
  return String(a).slice(0, 10) === String(b).slice(0, 10);
}

export async function checkNewWeek(pool, adminToken) {
  const nextWeekStart = getNextSaturday();
  const lastReservedWeek = await getLastReservedWeek(pool);

  if (await hasOpenSelf(adminToken, nextWeekStart)) {
    return {
      weekStartDate: nextWeekStart,
      isNewWeek: !sameWeek(lastReservedWeek, nextWeekStart),
    };
  }

  if (lastReservedWeek) {
    if (await hasOpenSelf(adminToken, lastReservedWeek)) {
      return {
        weekStartDate: lastReservedWeek,
        isNewWeek: false,
      };
    }
  }

  return null;
}

async function hasOpenSelf(token, weekStartDate) {
  for (const self of SAMAD_SELVES) {
    try {
      const res = await getSelfWeekPrograms(token, weekStartDate, self.id, { timeout: 20000 });
      if (res.status === 200 && isSelfOpenedInPanel(res.data)) return true;
    } catch (error) {
      console.error("[CHECK] self unavailable", self.id, error.message);
    }
  }
  return false;
}
