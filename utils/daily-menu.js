import { getSelfWeekPrograms } from "../api/services.js";
import { flattenWeekPrograms, getFoodCategory, getSamadAccessToken } from "./index.js";

export const DAILY_MENU_SELVES = [
  { id: 1, title: "سلف دانشگاه / کاله" },
  { id: 25, title: "یونی‌فود" },
  { id: 23, title: "کلین‌فود" },
  { id: 22, title: "فست‌فود شریف" },
  { id: 24, title: "کلانا" },
  { id: 20, title: "کاله پردیس مرکزی (بیرون‌بر)" },
  { id: 21, title: "کاله پردیس شمالی (بیرون‌بر)" },
];

const escapeHtml = (value) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export function getDailyMenuDates(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tehran", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  const part = (type) => parts.find((p) => p.type === type).value;
  const date = `${part("year")}-${part("month")}-${part("day")}`;
  const saturday = new Date(`${date}T00:00:00Z`);
  saturday.setUTCDate(saturday.getUTCDate() - ((saturday.getUTCDay() + 1) % 7));
  return { date, weekStartDate: `${saturday.toISOString().slice(0, 10)}+00:00:00` };
}

export function buildDailyMenuRichMessage(date, bySelf) {
  const dateParts = new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    numberingSystem: "latn",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).formatToParts(new Date(`${date}T12:00:00Z`));
  const datePart = (type) => dateParts.find((part) => part.type === type).value;
  const weekday = datePart("weekday").replace(/\u200c/g, " ");
  const dateFa = `${weekday} ${datePart("day")} ${datePart("month")} ${datePart("year")}`;
  const sections = [];
  for (const self of DAILY_MENU_SELVES) {
    const titles = self.id === 1 ? ["سلف دانشگاه", "کاله"] : [self.title];
    const groups = new Map(titles.map((title) => [title, []]));
    if (!Array.isArray(bySelf[self.id])) throw new Error(`Daily menu unavailable: self ${self.id}`);
    const seen = new Set();
    for (const p of bySelf[self.id]) {
      if (String(p.date).slice(0, 10) !== date) continue;
      if (p.mealTypeId != null && Number(p.mealTypeId) !== 1) continue;
      const types = p.programFoodTypes?.length ? p.programFoodTypes : [{ foodList: [{ name: p.foodName }], price: p.price }];
      for (const type of types)
        for (const food of type.foodList || []) {
          if (!food.name) continue;
          const rawPrice = type.price ?? p.price;
          const price = rawPrice == null || rawPrice === "" ? NaN : Number(rawPrice);
          const priceLabel = Number.isFinite(price) ? `${(price / 10).toLocaleString("fa-IR")} تومان` : "نامشخص";
          const title = self.id === 1 ? (getFoodCategory(food.name).id === "kaleh" ? "کاله" : "سلف دانشگاه") : self.title;
          const key = JSON.stringify([title, food.name, priceLabel]);
          if (seen.has(key)) continue;
          seen.add(key);
          groups.get(title).push(`<tr><td align="left">${priceLabel}</td><td>${escapeHtml(food.name)}</td></tr>`);
        }
    }
    for (const [title, rows] of groups) {
      const content = rows.length ? `<table bordered striped><tr><th align="left">قیمت</th><th>غذا</th></tr>${rows.join("\n")}</table>` : `<p>برای امروز برنامه غذایی ثبت نشده است</p>`;
      sections.push(`<p><b>${escapeHtml(title)}</b></p>${content}`);
    }
  }
  return `<h2>🍽 ناهار امروز چیه!؟</h2><p>📆 ${escapeHtml(dateFa)}</p>${sections.join("\n")}<p>@SharifSamad</p>`;
}

export async function fetchDailyMenu(pool, now = new Date()) {
  const { date, weekStartDate } = getDailyMenuDates(now);
  const token = await getSamadAccessToken(pool);
  if (!token) throw new Error("Samad login failed");
  const bySelf = {};
  await Promise.all(
    DAILY_MENU_SELVES.map(async (self) => {
      try {
        const res = await getSelfWeekPrograms(token, weekStartDate, self.id, { timeout: 20000 });
        bySelf[self.id] = res.status === 200 && Array.isArray(res.data?.payload?.selfWeekPrograms) ? flattenWeekPrograms(res.data) : null;
      } catch {
        bySelf[self.id] = null;
      }
    }),
  );
  return { date, bySelf };
}
