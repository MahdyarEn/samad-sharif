import { fetchUserProfile, getSelfWeekPrograms, loginUser } from "../api/services.js";
import config from "../config.js";
import { getAdminAccessToken, setAdminAccessToken } from "../db/index.js";
import crypto from "crypto";
import * as jalaali from "jalaali-js";
export function buildHomeKeyboard(isLogined) {
  if (!isLogined)
    return {
      inline_keyboard: [[{ text: "ورود به سامانه", callback_data: `LOGIN_SAMAD`, icon_custom_emoji_id: "5778570255555105942" }], [{ text: "راهنما", callback_data: `HELP`, icon_custom_emoji_id: "6028435952299413210" }]],
    };

  return {
    inline_keyboard: [
      [
        { text: "انتخاب روز های رزرو", callback_data: `MENU_RESERVE`, icon_custom_emoji_id: "5890937706803894250" },
        { text: "انتخاب اولویت غذا", callback_data: `MENU_PREFERENCE`, icon_custom_emoji_id: "6041874690220233085" },
      ],
      [
        { text: "حساب کاربری", callback_data: "MENU_ACCOUNT", icon_custom_emoji_id: "6035084557378654059" },
        { text: "تنظیمات", callback_data: "MENU_SETTINGS", icon_custom_emoji_id: "6032742198179532882" },
      ],
      [
        {
          text: "ورود به وب‌اپلیکیشن",
          web_app: { url: config.DOMAIN, icon_custom_emoji_id: "5776233299424843260" },
        },
      ],
      [{ text: "راهنما", callback_data: `HELP`, icon_custom_emoji_id: "6028435952299413210" }],
    ],
  };
}

export function backKeyboard() {
  return {
    inline_keyboard: [[{ text: "بازگشت", callback_data: "BACK", icon_custom_emoji_id: "6039539366177541657" }]],
  };
}

export const FOODS = [
  { id: 1, title: "چلو کباب کوبیده", price: 35000 },
  { id: 2, title: "چلوکباب کوبیده (کاله)", price: 108000 },
  { id: 3, title: "چلوکباب نگین دار", price: 35000 },

  { id: 4, title: "چلو جوجه‌کباب", price: 35000 },
  { id: 5, title: "چلو جوجه کباب (کاله)", price: 76000 },

  { id: 6, title: "شنیتسل مرغ با برنج", price: 35000 },
  { id: 7, title: "خوراک شنیتسل مرغ", price: 35000 },
  { id: 8, title: "خوراک فیله سوخاری", price: 25000 },
  { id: 9, title: "خوراک کوردن بلو", price: 35000 },
  { id: 10, title: "خوراک جوجه چینی", price: 25000 },

  { id: 11, title: "چلو مرغ ترش", price: 35000 },

  { id: 12, title: "زرشک‌پلو با مرغ", price: 35000 },
  { id: 13, title: "زرشک پلو با مرغ (کاله)", price: 65000 },

  { id: 14, title: "خوراک ماکارونی با گوشت", price: 25000 },
  { id: 15, title: "خوراک ماکارونی با گوشت (کاله)", price: 12000 },
  { id: 16, title: "خوراک ماکارونی فرمی", price: 25000 },
  { id: 17, title: "پیتزا مخلوط (کاله)", price: 95000 },

  { id: 18, title: "چلو‌خورش قورمه‌سبزی", price: 35000 },
  { id: 19, title: "چلوخورش قرمه سبزی (کاله)", price: 43500 },
  { id: 20, title: "چلوخورش فسنجان با مرغ", price: 35000 },
  { id: 21, title: "چلو‌خورش قیمه‌ سیب زمینی", price: 35000 },
  { id: 22, title: "چلوخورش قیمه سیب زمینی (کاله)", price: 57000 },
  { id: 23, title: "چلو‌خورش قیمه‌بادمجان", price: 35000 },
  { id: 24, title: "چلو خورشت مسما بادمجان", price: 35000 },
  { id: 25, title: "چلوخورشت آلو اسفناج", price: 35000 },
  { id: 26, title: "چلو‌خورش کرفس", price: 35000 },
  { id: 27, title: "چلو‌خورش لوبیا‌ سبز", price: 35000 },

  { id: 28, title: "عدس‌پلو با گوشت", price: 35000 },
  { id: 29, title: "عدس‌پلو با گوشت (کاله)", price: 52000 },
  { id: 30, title: "لوبیا پلو", price: 35000 },
  { id: 31, title: "لوبیاپلو با گوشت تکه (کاله)", price: 65000 },
  { id: 32, title: "استامبولی پلو با گوشت", price: 25000 },
  { id: 33, title: "رشته پلو با گوشت", price: 25000 },
  { id: 34, title: "سبزی پلو با تن ماهی", price: 35000 },

  { id: 35, title: "چلو با تن ماهی", price: 35000 },
  { id: 36, title: "چلو با شامی کباب", price: 35000 },

  { id: 37, title: "خوراک کتلت", price: 35000 },
  { id: 38, title: "خوراک کتلت مرغ", price: 25000 },
  { id: 39, title: "خوراک کوکو سیب‌زمینی", price: 25000 },
  { id: 40, title: "خوراک کوکو سبزی", price: 25000 },
  { id: 41, title: "خوراک میرزا قاسمی", price: 25000 },
  { id: 42, title: "خوراک قارچ و مرغ", price: 35000 },
  { id: 43, title: "خوراک کوفته تبریزی", price: 35000 },
  { id: 44, title: "خوراک تن ماهی", price: 25000 },

  { id: 45, title: "خوراک فلافل", price: 25000 },

  { id: 46, title: "سینی خوراک بندری (کاله)", price: 75000 },
  { id: 47, title: "سینی شنیتسل و کتلت (کاله)", price: 95000 },
  { id: 48, title: "سینی فیله سوخاری و فلافل (کاله)", price: 95000 },
  { id: 49, title: "سینی دونر و فلافل (کاله)", price: 95000 },
  { id: 50, title: "سینی خوراک فلافل (کاله)", price: 75000 },
  { id: 51, title: "سینی املت و نرگسی (کاله)", price: 75000 },
  { id: 52, title: "سینی ماکارونی و ناگت (کاله)", price: 57000 },
  { id: 53, title: "سینی ساندویچ و کتلت (کاله)", price: 95000 },
  { id: 54, title: "سینی ساندویچ و کوکوسبزی (کاله)", price: 95000 },
  { id: 55, title: "سینی پیتزا و کراکت (کاله)", price: 80000 },
  { id: 56, title: "سینی پیتزا و کوکوسبزی (کاله)", price: 95000 },

  { id: 57, title: "رشته پلو", price: 25000 },
  { id: 58, title: "پاستاچیکن آلفردو (فست‌فود شریف)", price: 65000 },
  { id: 59, title: "پاستاچیکن آلفردو (کلین‌فود)", price: 85000 },
  { id: 60, title: "چلوجوجه‌کباب‌مکزیکی (فست‌فود شریف)", price: 65000 },
  { id: 61, title: "چلوکباب‌کوبیده نگین‌دار (فست‌فود شریف)", price: 95000 },
  { id: 62, title: "چیزبرگر کلاسیک (کاله)", price: 65000 },
  { id: 63, title: "سالاد الویه مرغ (کاله)", price: 10000 },
  { id: 64, title: "ساندویچ پپرونی‌مخصوص (یونی‌فود)", price: 35000 },
  { id: 65, title: "ساندویچ دنر‌کباب‌گوشت (کلین‌فود)", price: 45000 },
  { id: 66, title: "ساندویچ دنرکباب‌گوشت‌و‌پنیر (یونی‌فود)", price: 45000 },
  { id: 67, title: "ساندویچ دنرکباب‌مرغ‌و‌پنیر (یونی‌فود)", price: 45000 },
  { id: 68, title: "ساندویچ دنرکباب‌مرغ (کلین‌فود)", price: 35000 },
  { id: 69, title: "ساندویچ ژامبون گوشت (کاله)", price: 16000 },
  { id: 70, title: "ساندویچ ژامبون‌گوشت (یونی‌فود)", price: 25000 },
  { id: 71, title: "ساندویچ ژامبون مرغ (کاله)", price: 16000 },
  { id: 72, title: "ساندویچ ژامبون‌مرغ (یونی‌فود)", price: 25000 },
  { id: 73, title: "ساندویچ شنیتسل‌مرغ (فست‌فود شریف)", price: 10000 },
  { id: 74, title: "ساندویچ مرغ انار و گردو (کاله)", price: 28000 },
  { id: 75, title: "ساندویچ مرغ پستو (کاله)", price: 28000 },
  { id: 76, title: "ساندویچ مرغ‌تنوری (فست‌فود شریف)", price: 35000 },
  { id: 77, title: "ساندویچ مرغ گریل (کاله)", price: 28000 },
  { id: 78, title: "ساندویچ همبرگر‌ذغالی (کلین‌فود)", price: 35000 },
  { id: 79, title: "کلاب ژامبون‌مرغ‌دبل (کلانا)", price: 10000 },
  { id: 80, title: "کلاب سینه‌بوقلمون‌دبل (کلانا)", price: 10000 },
  { id: 81, title: "کلاب فیله‌گوشت‌دبل (کلانا)", price: 10000 },
  { id: 82, title: "کلاب مرغ‌چیلی‌دبل (کلانا)", price: 10000 },
  { id: 83, title: "کلاب مرغ‌مخصوص‌دبل (کلانا)", price: 10000 },
  { id: 84, title: "لازانیا (کلین‌فود)", price: 135000 },
  { id: 85, title: "خوراک شنیتسل وکتلت", price: 35000 },

  { id: 86, title: "چلو کباب کوبیده(فست فود شریف)", price: 75000 },
  { id: 87, title: "چلوخورش قیمه بادمجان (فست فود شریف)", price: 35000 },
  { id: 88, title: "خوراک بندری", price: 35000 },
  { id: 89, title: "رپ کارتوفل(کلانا)", price: 5000 },
  { id: 90, title: "رپ گوشت(کلانا)", price: 45000 },
  { id: 91, title: "ساندویچ الویه مرغ و ژامبون(فست فود شریف)", price: 35000 },
  { id: 92, title: "لوبیاپلو (فست فود شریف)", price: 35000 },

  { id: 93, title: "بندری پرسی 400گرمی (کلین‌فود)", price: 35000 },
  { id: 94, title: "ساندویچ بزرگ کالباس مرغ 70%(کلین فود)", price: 35000 },
  { id: 95, title: "ساندویچ نرمال چکین برگر ذغالی باپنیرگودا(کلین فود)", price: 35000 },
  { id: 96, title: "ساندویچ نرمال ژامبون گوشت 90%(کلین فود)", price: 35000 },
];

export function normalizeFoodName(name) {
  return String(name || "")
    .replace(/\u200c/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const FOOD_CATEGORIES = [
  { id: "self", title: "سلف مرکزی", icon_custom_emoji_id: "5359678839591018693" },
  { id: "kaleh", title: "کاله", icon_custom_emoji_id: "5328111877937438773" },
  { id: "unifood", title: "یونی‌فود", icon_custom_emoji_id: "5328233026079957815" },
  { id: "kalana", title: "کلانا", icon_custom_emoji_id: "5328093903499305675" },
  { id: "sharifi", title: "فست‌فود شریف", icon_custom_emoji_id: "5330083572868979930" },
  { id: "clean", title: "کلین‌فود", icon_custom_emoji_id: "5328065681269203890" },
];

export const SAMAD_SELVES = [
  { id: 1, key: "main", title: "سلف مرکزی / کاله", categoryIds: ["self", "kaleh"] },
  { id: 22, key: "sharifi", title: "فست‌فود شریف", categoryIds: ["sharifi"] },
  { id: 23, key: "clean", title: "کلین‌فود", categoryIds: ["clean"] },
  { id: 24, key: "kalana", title: "کلانا", categoryIds: ["kalana"] },
  { id: 25, key: "unifood", title: "یونی‌فود", categoryIds: ["unifood"] },
];

export function getMainSelfId(gender) {
  return String(gender || "").includes("زن") ? 2 : 1;
}

export function resolveSelfId(selfId, gender) {
  const id = Number(selfId);
  if (id === 1 || id === 2) return getMainSelfId(gender);
  return id;
}

export function resolveWaitSelves(wait, gender) {
  return [...new Set(normalizeWaitSelves(wait).map((id) => resolveSelfId(id, gender)))];
}

export function getReserveSelfIds(gender) {
  return [getMainSelfId(gender), 22, 23, 24, 25];
}

export function getFoodCategory(title = "") {
  const t = normalizeFoodName(title);
  if (/یونیفود|یونی\s*فود/.test(t)) return FOOD_CATEGORIES.find((c) => c.id === "unifood");
  if (/کلینفود|کلین\s*فود/.test(t)) return FOOD_CATEGORIES.find((c) => c.id === "clean");
  if (/فستفود\s*شریف|فست\s*فود\s*شریف/.test(t)) return FOOD_CATEGORIES.find((c) => c.id === "sharifi");
  if (/کلانا/.test(t) || /^کلاب\s/.test(t)) return FOOD_CATEGORIES.find((c) => c.id === "kalana");
  if (/کاله/.test(t)) return FOOD_CATEGORIES.find((c) => c.id === "kaleh");
  return FOOD_CATEGORIES.find((c) => c.id === "self");
}

export function getSelfIdsForFood(title = "", gender) {
  const catId = getFoodCategory(title)?.id;
  if (catId === "self" || catId === "kaleh") return [getMainSelfId(gender)];
  const self = SAMAD_SELVES.find((s) => s.categoryIds.includes(catId));
  return [self?.id ?? getMainSelfId(gender)];
}

export function buildPreferenceText(userId, foods, userFoodState) {
  const state = userFoodState.get(userId);
  const selected = Array.isArray(state?.foods) ? state.foods : [];
  const catId = state?.foodCategory || null;
  const cat = catId ? FOOD_CATEGORIES.find((c) => c.id === catId) : null;

  if (selected.length === 0) {
    if (cat) {
      return `<tg-emoji emoji-id="5359678839591018693">🍽</tg-emoji> دسته «${cat.title}»\n\nهنوز غذایی انتخاب نکرده‌اید. از لیست زیر انتخاب کنید.`;
    }
    return `<tg-emoji emoji-id="5359678839591018693">🍽</tg-emoji> لطفا به ترتیب علاقه، غذاهای موردنظر خودتون رو انتخاب کنید\n\nاول یک دسته را انتخاب کنید:`;
  }

  const lines = selected.map((food, index) => {
    const p = food.price ?? foods.find((f) => f.id === food.id)?.price;
    return p ? `${index + 1}. ${food.title}  -  <b>${Number(p).toLocaleString("en-US")} تومان</b>` : `${index + 1}. ${food.title}`;
  });

  const catHint = cat ? `\n\n<tg-emoji emoji-id="6039630677182254664">📂</tg-emoji> در حال مشاهده: <b>${cat.title}</b>` : `\n\nبرای ادامه، یک دسته را انتخاب کنید.`;

  return `<tg-emoji emoji-id="5427009714745517609">✅</tg-emoji> انتخاب فعلی شما (به ترتیب اولویت):\n\n${lines.join("\n")}${catHint}`;
}

export function buildFoodKeyboard(userId, foods, userFoodState) {
  const state = userFoodState.get(userId);
  const selected = Array.isArray(state?.foods) ? state.foods : [];
  const activeCatId = state?.foodCategory || null;
  const keyboard = [];

  if (!activeCatId) {
    for (let i = 0; i < FOOD_CATEGORIES.length; i += 2) {
      const row = [];
      for (const cat of FOOD_CATEGORIES.slice(i, i + 2)) {
        const count = selected.filter((f) => getFoodCategory(f.title).id === cat.id).length;
        const total = foods.filter((f) => getFoodCategory(f.title).id === cat.id).length;
        if (total === 0) continue;
        row.push({
          text: count > 0 ? `${cat.title} (${count})` : cat.title,
          callback_data: `FOOD_CAT:${cat.id}`,
          icon_custom_emoji_id: cat.icon_custom_emoji_id,
          style: "primary",
        });
      }
      if (row.length) keyboard.push(row);
    }

    keyboard.push([
      { text: "بازگشت", callback_data: "BACK", icon_custom_emoji_id: "6039539366177541657" },
      { text: "ثبت نهایی", callback_data: "FOOD_CONFIRM", icon_custom_emoji_id: "5774022692642492953" },
    ]);
    return { inline_keyboard: keyboard };
  }

  const cat = FOOD_CATEGORIES.find((c) => c.id === activeCatId);
  if (cat) {
    keyboard.push([
      {
        text: cat.title,
        callback_data: "FOOD_CAT_HOME",
        icon_custom_emoji_id: cat.icon_custom_emoji_id,
        style: "primary",
      },
    ]);
  }

  const items = foods.filter((f) => getFoodCategory(f.title).id === activeCatId);
  for (const food of items) {
    const index = selected.findIndex((f) => f.id === food.id);
    const isSelected = index !== -1;
    const nameBtn = {
      text: isSelected ? `${index + 1}. ${food.title}` : food.title,
      callback_data: `FOOD_TOGGLE:${food.id}`,
    };
    if (isSelected) nameBtn.style = "success";

    const priceBtn = {
      text: `${Number(food.price).toLocaleString("en-US")}`,
      callback_data: `FOOD_TOGGLE:${food.id}`,
      icon_custom_emoji_id: "5782928157006893436",
    };
    if (isSelected) priceBtn.style = "success";
    keyboard.push([priceBtn, nameBtn]);
  }

  keyboard.push([
    { text: "دسته‌ها", callback_data: "FOOD_CAT_HOME", icon_custom_emoji_id: "6039539366177541657" },
    { text: "ثبت نهایی", callback_data: "FOOD_CONFIRM", icon_custom_emoji_id: "5774022692642492953" },
  ]);
  return { inline_keyboard: keyboard };
}

export const DAYS = [
  { id: 0, title: "شنبه", english: "Saturday" },
  { id: 1, title: "یکشنبه", english: "Sunday" },
  { id: 2, title: "دوشنبه", english: "Monday" },
  { id: 3, title: "سه‌شنبه", english: "Tuesday" },
  { id: 4, title: "چهارشنبه", english: "Wednesday" },
];

export function buildDaysKeyboard(userId, days, userState) {
  const selectedDays = Array.isArray(userState.get(userId)?.days) ? userState.get(userId).days : [];

  const buttons = days.map((day) => {
    const isSelected = selectedDays.some((d) => d.id === day.id);
    return [
      {
        text: `${day.title}`,
        icon_custom_emoji_id: `${isSelected ? "5774022692642492953" : "5774077015388852135"}`,
        callback_data: `DAY_TOGGLE:${day.id}`,
      },
    ];
  });

  buttons.push([
    { text: "بازگشت", callback_data: "BACK", icon_custom_emoji_id: "6039539366177541657" },
    { text: "تأیید روزها", callback_data: "DAYS_CONFIRM", icon_custom_emoji_id: "5774022692642492953" },
  ]);

  return {
    inline_keyboard: buttons,
  };
}

export function buildDaysText(userId, days, userState) {
  const selectedDays = Array.isArray(userState.get(userId)?.days) ? userState.get(userId).days : [];

  if (selectedDays.length === 0) {
    return "📅 هنوز روزی انتخاب نکرده‌ اید.\nروزهای مورد نظر خود را انتخاب کنید:";
  }

  const list = selectedDays.map((d) => `• ${d.title}`).join("\n");
  return `<tg-emoji emoji-id="5431897022456145283">📆</tg-emoji> روزهای انتخاب‌شده:\n${list}\n\nمی‌توانید روزهای دیگر را اضافه یا حذف کنید:`;
}

export function getNextSaturday() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (6 - day + 7) % 7 || 7;
  const saturday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff));
  return `${saturday.getUTCFullYear()}-${String(saturday.getUTCMonth() + 1).padStart(2, "0")}-${String(saturday.getUTCDate()).padStart(2, "0")}+00:00:00`;
}

export function flattenWeekPrograms(apiData) {
  const list = apiData?.payload?.selfWeekPrograms;
  if (!Array.isArray(list)) return [];
  return list.flat().filter(Boolean);
}

export function isWeekMenuReady(apiData) {
  const visible = flattenWeekPrograms(apiData).filter((p) => p?.hideInPanel === false);
  if (visible.length === 0) return false;
  const requiredDays = ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"];
  return requiredDays.every((day) => visible.some((p) => p.dayTranslated === day));
}

export function isSelfOpenedInPanel(apiData) {
  return flattenWeekPrograms(apiData).some((p) => p?.hideInPanel === false);
}

export function getVisibleDaysFa(apiData) {
  const dayTitle = Object.fromEntries(DAYS.map((d) => [d.english, d.title]));
  const order = DAYS.map((d) => d.english);
  const seen = new Set(
    flattenWeekPrograms(apiData)
      .filter((p) => p?.hideInPanel === false && p?.dayTranslated)
      .map((p) => p.dayTranslated),
  );
  return order.filter((en) => seen.has(en)).map((en) => dayTitle[en]);
}

const ALLOWED_WAIT_SELF_IDS = new Set(SAMAD_SELVES.map((s) => s.id));

export function normalizeWaitSelves(value) {
  let arr = value;
  if (typeof arr === "string") {
    try {
      arr = JSON.parse(arr);
    } catch {
      arr = [];
    }
  }
  if (!Array.isArray(arr)) arr = [];
  const ids = [...new Set(arr.map((n) => Number(n)).filter((n) => ALLOWED_WAIT_SELF_IDS.has(n)))];
  return ids.length ? ids : [1];
}

export async function areSelvesReady(token, weekStartDate, selfIds) {
  const ids = [...new Set((selfIds || []).map(Number).filter((n) => Number.isFinite(n)))];
  if (!ids.length) return false;
  for (const selfId of ids) {
    const res = await getSelfWeekPrograms(token, weekStartDate, selfId);
    if (res?.status !== 200 || !isWeekMenuReady(res.data)) return false;
  }
  return true;
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export function buildAccountKeyboard() {
  return {
    inline_keyboard: [
      [{ text: "اطلاعات کاربری", callback_data: "ACCOUNT_INFO", icon_custom_emoji_id: "6035084557378654059" }],
      [{ text: "ویرایش اطلاعات ورود", callback_data: "ACCOUNT_EDIT_LOGIN", icon_custom_emoji_id: "6039614175917903752" }],
      [{ text: "خروج از حساب کاربری", callback_data: "ACCOUNT_LOGOUT", icon_custom_emoji_id: "6032608126480421344" }],
      [{ text: "بازگشت", callback_data: "BACK", icon_custom_emoji_id: "6039539366177541657" }],
    ],
  };
}

function parseGregorianYmd(value) {
  if (!value) return null;
  const str = typeof value === "string" ? value : "";
  const fromStr = str.match(/(\d{4})-(\d{2})-(\d{2})/);
  if (fromStr) return { y: Number(fromStr[1]), m: Number(fromStr[2]), d: Number(fromStr[3]) };

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return { y: value.getFullYear(), m: value.getMonth() + 1, d: value.getDate() };
  }

  return null;
}

export function formatLastCheckedProgram(value) {
  if (!value) return "هنوز بررسی نشده";
  const ymd = parseGregorianYmd(value);
  if (!ymd) return String(value).slice(0, 10);

  const { jy, jm, jd } = jalaali.toJalaali(ymd.y, ymd.m, ymd.d);
  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}

export function buildSettingsText(user) {
  const autoOn = Number(user?.auto_reserve) === 1;
  const forceOn = Number(user?.force_reserve) === 1;
  const lastChecked = formatLastCheckedProgram(user?.last_checked_program);
  const waitSelves = normalizeWaitSelves(user?.wait_selves);
  const waitLines = SAMAD_SELVES.filter((s) => waitSelves.includes(s.id))
    .map((s) => `• ${s.title}`)
    .join("\n");

  return `<tg-emoji emoji-id="5818705028424141605">⚙️</tg-emoji> <b>تنظیمات رزرو</b>

<tg-emoji emoji-id="5850693253355017860">#️⃣</tg-emoji> رزرو خودکار: <b>${autoOn ? `روشن <tg-emoji emoji-id="5774022692642492953">✅</tg-emoji>` : `خاموش <tg-emoji emoji-id="5774077015388852135">❌</tg-emoji>`}</b>
<tg-emoji emoji-id="5850693253355017860">#️⃣</tg-emoji> رزرو اجباری غذای روز: <b>${forceOn ? `روشن <tg-emoji emoji-id="5774022692642492953">✅</tg-emoji>` : `خاموش <tg-emoji emoji-id="5774077015388852135">❌</tg-emoji>`}</b>
<tg-emoji emoji-id="5850693253355017860">#️⃣</tg-emoji> آخرین هفته بررسی‌شده: <code>${lastChecked}</code>

<tg-emoji emoji-id="5431897022456145283">📅</tg-emoji> <b>شروع رزرو پس از آماده‌شدن:</b>
${waitLines || "• سلف مرکزی / کاله"}

<tg-emoji emoji-id="5314346928660554905">⚠️</tg-emoji> رزرو فقط وقتی شروع می‌شود که همهٔ سلف‌های انتخابی در سامانه نمایش داده شده باشند. اگر سلفی آن هفته برنامه نداشته باشد، رزرو عقب می‌افتد.

<tg-emoji emoji-id="5314346928660554905">⚠️</tg-emoji> اگر رزرو اجباری روشن باشد و هیچ‌کدام از اولویت‌های شما در منوی آن روز نباشد (یا همه پر شده باشند)، ربات از بقیه غذاهای همان روز امتحان می‌کند تا یکی موفق شود.

روی دکمه‌ها بزنید تا وضعیت را تغییر دهید <tg-emoji emoji-id="5470177992950946662">👇</tg-emoji>`;
}

export function buildSettingsKeyboard(user) {
  const autoOn = Number(user?.auto_reserve) === 1;
  const forceOn = Number(user?.force_reserve) === 1;
  const waitSelves = normalizeWaitSelves(user?.wait_selves);

  const selfButtons = SAMAD_SELVES.map((self) => {
    const on = waitSelves.includes(self.id);
    const btn = {
      text: self.title,
      callback_data: `SETTINGS_TOGGLE_SELF:${self.id}`,
      icon_custom_emoji_id: on ? "5774022692642492953" : "5774077015388852135",
    };
    if (on) btn.style = "success";
    return btn;
  });

  const selfRows = [];
  for (let i = 0; i < selfButtons.length; i += 2) {
    selfRows.push(selfButtons.slice(i, i + 2));
  }

  return {
    inline_keyboard: [
      [
        {
          text: `رزرو خودکار: ${autoOn ? "روشن" : "خاموش"}`,
          callback_data: "SETTINGS_TOGGLE_AUTO",
          icon_custom_emoji_id: `${autoOn ? "5774022692642492953" : "5774077015388852135"}`,
        },
      ],
      [
        {
          text: `رزرو اجباری غذای روز: ${forceOn ? "روشن" : "خاموش"}`,
          callback_data: "SETTINGS_TOGGLE_FORCE",
          icon_custom_emoji_id: `${forceOn ? "5774022692642492953" : "5774077015388852135"}`,
        },
      ],
      [
        {
          text: "شروع رزرو پس از آماده‌شدن",
          callback_data: "SETTINGS_SELVES_INFO",
          icon_custom_emoji_id: "5431897022456145283",
          style: "primary",
        },
      ],
      ...selfRows,
      [{ text: "بازگشت", callback_data: "BACK", icon_custom_emoji_id: "6039539366177541657" }],
    ],
  };
}

export async function getSamadAccessToken(pool) {
  const res = await getAdminAccessToken(pool);
  let access_token;
  if (!res) {
    const resalt2 = await loginUser(config.SAMAD_USERNAME, config.SAMAD_PASSWORD);
    if (resalt2?.access_token) {
      await setAdminAccessToken(pool, resalt2?.access_token);
      return resalt2?.access_token;
    }
  } else {
    access_token = await getAdminAccessToken(pool);
    let result = await fetchUserProfile(config.SAMAD_USERNAME);
    if (result.error_description == "Invalid access token") {
      const resalt2 = await loginUser(config.SAMAD_USERNAME, config.SAMAD_PASSWORD);
      if (resalt2?.access_token) {
        await setAdminAccessToken(pool, resalt2?.access_token);
        return resalt2?.access_token;
      }
    } else {
      return access_token;
    }
  }

  return null;
}
export function normalizeArray(value) {
  if (!value) return [];

  if (Array.isArray(value)) return value;

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

export const PRIORITY_USERS = new Set([
  7672690394, 6789081090, 6380541321, 1294142200, 5172295118, 5611274321, 1794801892, 1129506561, 1144899446, 358114222, 6305899449, 1485455710, 661009969, 5422717034, 6717838393, 6113802539, 5401358599, 6493718498, 985677026, 5340478475, 1455558347, 1215651154, 8392658456,
  480225342, 1654053942, 7727591453, 7349894496, 6189662758, 618138833, 6129638645, 1985088412, 1360720393, 5393868617, 8231438658, 6350935813, 131618119, 1568641824, 8492180012, 7625892764, 5281617910, 6002878395, 5355895101, 720230451, 1831745322, 693464604, 6010801514,
  133999589, 1135773302, 1352697614, 5812623701, 448962281, 6641925712, 5788498184, 8093812189, 8499373497, 8459136776, 5128363658, 6231855439, 2136432772, 1100549924, 1811359942, 6868358536, 7567203821, 795414349, 7746902094, 1538217406, 7114718929, 7323402979, 5173727398,
  1346156292, 8309702087, 259904400, 1048856416, 1194580861, 683051084, 983426239, 6373851854, 2023069977, 508420637, 8147624583, 6766578299, 388376574, 1159440893, 1854079031, 8363319822, 1244350963, 8295420922, 1900006068, 2052969623, 1656070656, 7397732285, 1116515983,
  1529189498, 7487853442, 8127014786, 916036110, 8078529142, 6013807799, 6230723601, 709712212, 1145070412, 1936676861, 5754965025, 853618586, 5597397249, 387394348, 7289615356, 5352101828, 8425111960, 1698986835, 5916706222, 6613933863, 8116386345, 8007533740, 8152950546,
  72986574, 8305778555, 404623651, 274989966, 5220686671, 6964074021, 1069129572, 379075872, 1283173649, 851269421, 1585743540, 6215875760, 1856962525, 311474197, 1489335100, 1149150675, 1035537594, 1099766840, 5883998073, 887889261, 2020081564, 7959160092, 1497579437,
  1932202740, 1235496823, 343748856, 661659142, 1880349583, 5272970943, 2041637341, 5766849973, 1184861381, 5292504324, 5489299851, 903556263, 8225978255, 5829291278, 8128307442, 5358679218, 1118244666, 1145266637,
]);

export function isPriorityUser(userId) {
  return PRIORITY_USERS.has(Number(userId));
}

export function buildWelcomeMessage(isPriority) {
  const priorityBlock = isPriority
    ? `<h3><tg-emoji emoji-id="5843553939672274145">⚡️</tg-emoji> اولویت ویژه رزرو</h3>
<aside><b><mark>اکانت شما جزو ورودی کامپیوتر ۱۴۰۴ شناسایی شد و اولویت رزرو غذا برای شما از سایر کاربران بیشتر است.</mark></b></aside>`
    : `<h3><tg-emoji emoji-id="5879501875341955281">ℹ️</tg-emoji> درباره اولویت رزرو</h3>
<aside><b><mark>این ربات برای دانشجویان ورودی ۱۴۰۴ دانشکده کامپیوتر نوشته شده و آن‌ها در اولویت رزرو زودتری هستند. چون ماهیت ربات رزرو سریع غذاهای کم‌ظرفیت است، ابتدا رزرو کاربران نام‌برده انجام می‌شود و بعد به‌ترتیب تاریخ عضویت.</mark></b></aside>`;

  return `<h2>سلام</h2>
<p>به ربات رزرو خودکار غذای سامانه سماد (ویژه دانشجویان دانشگاه صنعتی شریف) خوش آمدید</p>
<p>این ربات امکان رزرو خودکار غذای سلف را مطابق با ترجیحات شما فراهم می‌کند.</p>
<p><tg-emoji emoji-id="5427009714745517609">✅</tg-emoji> در حال حاضر سلف مرکزی پشتیبانی می‌شود (غذای سلف، کاله، یونی‌فود، کلانا، فست‌فود شریف و کلین‌فود).</p>
<p><tg-emoji emoji-id="5226512880362332956">📖</tg-emoji> <b>مراحل فعال‌سازی رزرو خودکار:</b></p>
<ul>
<li>انتخاب حداقل یک غذا</li>
<li>انتخاب حداقل یک روز از هفته</li>
</ul>
<p><tg-emoji emoji-id="5213181173026533794">⚠️</tg-emoji> <b>پیش‌نیاز استفاده:</b></p>
<ul>
<li>داشتن اعتبار کافی در سامانه سماد</li>
</ul>
<p>توجه: تنظیمات فقط یک‌بار انجام می‌شود و در صورت نیاز، در هر زمان قابل تغییر است.</p>
<p><tg-emoji emoji-id="5242628160297641831">🔔</tg-emoji> ربات نتیجه هر تلاش برای رزرو (موفق یا ناموفق) را به‌صورت پیام به شما اطلاع می‌دهد.</p>
<p><tg-emoji emoji-id="5434144690511290129">📢</tg-emoji> برای اطلاع‌رسانی از آغاز رزرو غذا، عضو کانال زیر شوید:<br/>@Sharifsamad</p>
<hr/>
${priorityBlock}
<footer>لطفا برای ادامه، یکی از گزینه‌های زیر را انتخاب نمایید <tg-emoji emoji-id="5470177992950946662">👇</tg-emoji></footer>`;
}

export function sendRichMessage(bot, chatId, html, options = {}) {
  const form = {
    chat_id: chatId,
    rich_message: JSON.stringify({
      html,
      is_rtl: true,
      skip_entity_detection: false,
    }),
    ...options,
  };
  if (form.reply_markup && typeof form.reply_markup !== "string") {
    form.reply_markup = JSON.stringify(form.reply_markup);
  }
  return bot._request("sendRichMessage", { form });
}

export function editRichMessage(bot, chatId, messageId, html, options = {}) {
  const form = {
    chat_id: chatId,
    message_id: messageId,
    rich_message: JSON.stringify({
      html,
      is_rtl: true,
      skip_entity_detection: false,
    }),
    ...options,
  };
  if (form.reply_markup && typeof form.reply_markup !== "string") {
    form.reply_markup = JSON.stringify(form.reply_markup);
  }
  return bot._request("editMessageText", { form });
}

function escapeRichHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function fetchAllSelvesWeekPrograms(token, weekStartDate) {
  const bySelf = {};
  for (const self of SAMAD_SELVES) {
    try {
      const res = await getSelfWeekPrograms(token, weekStartDate, self.id);
      bySelf[self.id] = flattenWeekPrograms(res?.data);
    } catch {
      bySelf[self.id] = [];
    }
  }
  return bySelf;
}

export function getSelvesWithProgram(bySelf) {
  return SAMAD_SELVES.filter((s) => (bySelf?.[s.id] || []).length > 0);
}

export function buildWeekMenuFingerprint(bySelf) {
  return SAMAD_SELVES.map((s) => {
    const n = (bySelf?.[s.id] || []).length;
    return n > 0 ? `${s.id}:${n}` : null;
  })
    .filter(Boolean)
    .join("|");
}

export function buildWeekMenuRichMessage(weekStartDate, bySelf) {
  const weekFa = formatLastCheckedProgram(weekStartDate);
  const weekEn = String(weekStartDate).slice(0, 10);
  const all = Object.values(bySelf || {}).flat();
  const hasAny = all.length > 0;
  const allHidden = hasAny && all.every((p) => p?.hideInPanel !== false);
  const anyHidden = hasAny && all.some((p) => p?.hideInPanel !== false);
  const withProgram = getSelvesWithProgram(bySelf);

  const statusLine = !hasAny
    ? `<aside><b>برای این هفته برنامه‌ای پیدا نشد.</b></aside>`
    : allHidden
      ? `<aside><b>درحال حاضر در سماد قابل رزرو نمی‌باشد</b></aside>`
      : anyHidden
        ? `<aside><b>درحال حاضر برخی از سلف‌ها در سماد قابل رزرو نمی‌باشد</b></aside>`
        : `<aside><b>قابل رزرو از طریق سماد</b></aside>`;

  const dayBlocks = DAYS.map((day) => {
    const rows = [];
    for (const self of SAMAD_SELVES) {
      const items = (bySelf[self.id] || []).filter((p) => p?.dayTranslated === day.english && p?.foodName);
      if (!items.length) {
        rows.push(
          `<tr><td>-</td><td><i>فعلا بدون برنامه غذایی</i></td><td>${escapeRichHtml(self.title)}</td></tr>`,
        );
        continue;
      }
      for (const p of items) {
        const price = Number(p.price);
        const priceLabel = Number.isFinite(price) ? `${Math.round(price / 10).toLocaleString("en-US")} تومان` : "-";
        rows.push(
          `<tr><td align="left">${escapeRichHtml(priceLabel)}</td><td>${escapeRichHtml(p.foodName)}</td><td>${escapeRichHtml(self.title)}</td></tr>`,
        );
      }
    }
    return `<h3><tg-emoji emoji-id="5431897022456145283">📅</tg-emoji> ${day.title}</h3>
<table bordered striped>
<tr><th align="left">قیمت</th><th>غذا</th><th>سلف</th></tr>
${rows.join("\n")}
</table>`;
  }).join("\n");

  return `<h2><tg-emoji emoji-id="5359678839591018693">🍽</tg-emoji> منوی هفته سماد</h2>
<p>شروع هفته: <b>${escapeRichHtml(weekFa)}</b> · <code>${escapeRichHtml(weekEn)}</code></p>
<p>سلف‌های دارای برنامه: <b>${withProgram.length}</b> از ${SAMAD_SELVES.length}</p>
${statusLine}
<hr/>
${dayBlocks}
<hr/>
<p><b>برنامه غذایی هفته جدید مشخص شد.</b></p>
<p><b>به محض باز شدن رزرو در سماد، در کانال اطلاع‌رسانی می‌شود.</b></p>
<p><b>امکان رزرو خودکار با ربات:</b><br/>@samadSharifBot</p>
`;
}

export function verifyTelegramWebAppData(telegramInitData) {
  if (!telegramInitData) return null;
  const urlParams = new URLSearchParams(telegramInitData);
  const hash = urlParams.get("hash");
  urlParams.delete("hash");
  const params = Array.from(urlParams.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, val]) => `${key}=${val}`)
    .join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(config.TOKEN).digest();
  const calculatedHash = crypto.createHmac("sha256", secretKey).update(params).digest("hex");
  if (calculatedHash === hash) {
    const userDataStr = urlParams.get("user");
    if (userDataStr) {
      return JSON.parse(userDataStr);
    }
  }
  return null;
}
