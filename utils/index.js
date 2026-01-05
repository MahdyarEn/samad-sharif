import { fetchUserProfile, loginUser } from "../api/services.js";
import config from "../config.js";
import { getAdminAccessToken, setAdminAccessToken } from "../db/index.js";
import crypto from "crypto";
export function buildHomeKeyboard(isLogined) {
  if (!isLogined)
    return {
      inline_keyboard: [[{ text: "🔐 ورود به سامانه", callback_data: `LOGIN_SAMAD` }], [{ text: "ℹ️ راهنما", callback_data: `HELP` }]],
    };

  return {
    inline_keyboard: [
      [
        { text: "📋 انتخاب روز های رزرو", callback_data: `MENU_RESERVE` },
        { text: "⭐ انتخاب اولویت غذا", callback_data: `MENU_PREFERENCE` },
      ],
      [{ text: "⚙️ حساب کاربری", callback_data: "MENU_ACCOUNT" }],
      [
        {
          text: "🛠 ورود به وب‌اپلیکیشن",
          web_app: { url: config.DOMAIN },
        },
      ],
      [{ text: "ℹ️ راهنما", callback_data: `HELP` }],
    ],
  };
}

export function backKeyboard() {
  return {
    inline_keyboard: [[{ text: "🔙 بازگشت", callback_data: "BACK" }]],
  };
}

export const FOODS = [
  { id: 1, title: "چلو کباب کوبیده" },
  { id: 2, title: "چلوکباب کوبیده (کاله)" },
  { id: 3, title: "چلوکباب نگین دار" },

  { id: 4, title: "چلو جوجه‌کباب" },
  { id: 5, title: "چلو جوجه کباب (کاله)" },

  { id: 6, title: "شنیتسل مرغ با برنج" },
  { id: 7, title: "خوراک شنیتسل مرغ" },
  { id: 8, title: "خوراک فیله سوخاری" },
  { id: 9, title: "خوراک کوردن بلو" },
  { id: 10, title: "خوراک جوجه چینی" },

  { id: 11, title: "چلو مرغ ترش" },

  { id: 12, title: "زرشک‌پلو با مرغ" },
  { id: 13, title: "زرشک پلو با مرغ (کاله)" },

  { id: 14, title: "خوراک ماکارونی با گوشت" },
  { id: 15, title: "خوراک ماکارونی با گوشت (کاله)" },
  { id: 16, title: "خوراک ماکارونی فرمی" },
  { id: 17, title: "پیتزا مخلوط (کاله)" },

  { id: 18, title: "چلو‌خورش قورمه‌سبزی" },
  { id: 19, title: "چلوخورش قرمه سبزی (کاله)" },
  { id: 20, title: "چلوخورش فسنجان با مرغ" },
  { id: 21, title: "چلو‌خورش قیمه‌ سیب زمینی" },
  { id: 22, title: "چلوخورش قیمه سیب زمینی (کاله)" },
  { id: 23, title: "چلو‌خورش قیمه‌بادمجان" },
  { id: 24, title: "چلو خورشت مسما بادمجان" },
  { id: 25, title: "چلوخورشت آلو اسفناج" },
  { id: 26, title: "چلو‌خورش کرفس" },
  { id: 27, title: "چلو‌خورش لوبیا‌ سبز" },

  { id: 28, title: "عدس‌پلو با گوشت" },
  { id: 29, title: "عدس‌پلو با گوشت (کاله)" },
  { id: 30, title: "لوبیا پلو" },
  { id: 31, title: "لوبیاپلو با گوشت تکه (کاله)" },
  { id: 32, title: "استامبولی پلو با گوشت" },
  { id: 33, title: "رشته پلو با گوشت" },
  { id: 34, title: "سبزی پلو با تن ماهی" },

  { id: 35, title: "چلو با تن ماهی" },
  { id: 36, title: "چلو با شامی کباب" },

  { id: 37, title: "خوراک کتلت" },
  { id: 38, title: "خوراک کتلت مرغ" },
  { id: 39, title: "خوراک کوکو سیب‌زمینی" },
  { id: 40, title: "خوراک کوکو سبزی" },
  { id: 41, title: "خوراک میرزا قاسمی" },
  { id: 42, title: "خوراک قارچ و مرغ" },
  { id: 43, title: "خوراک کوفته تبریزی" },
  { id: 44, title: "خوراک تن ماهی" },

  { id: 45, title: "خوراک فلافل" },

  { id: 46, title: "سینی خوراک بندری (کاله)" },
  { id: 47, title: "سینی شنیتسل و کتلت (کاله)" },
  { id: 48, title: "سینی فیله سوخاری و فلافل (کاله)" },
  { id: 49, title: "سینی دونر و فلافل (کاله)" },
  { id: 50, title: "سینی خوراک فلافل (کاله)" },
  { id: 51, title: "سینی املت و نرگسی (کاله)" },
  { id: 52, title: "سینی ماکارونی و ناگت (کاله)" },
  { id: 53, title: "سینی ساندویچ و کتلت (کاله)" },
  { id: 54, title: "سینی ساندویچ و کوکوسبزی (کاله)" },
  { id: 55, title: "سینی پیتزا و کراکت (کاله)" },
  { id: 56, title: "سینی پیتزا و کوکوسبزی (کاله)" },
];

export function buildPreferenceText(userId, foods, userFoodState) {
  const state = userFoodState.get(userId);
  const selected = Array.isArray(state?.foods) ? state.foods : [];

  if (selected.length === 0) {
    return "🍽 لطفا به ترتیب علاقه، غذاهای موردنظر خودتون رو انتخاب کنید";
  }

  const lines = selected.map((food, index) => {
    return `${index + 1}. ${food.title}`;
  });

  return `✅ انتخاب فعلی شما (به ترتیب اولویت):\n\n${lines.join("\n")}\n\n👇 برای تغییر، روی دکمه‌ها بزنید`;
}

export function buildFoodKeyboard(userId, foods, userFoodState) {
  const state = userFoodState.get(userId);
  const selected = Array.isArray(state?.foods) ? state.foods : [];

  const keyboard = foods.map((food) => {
    const index = selected.findIndex((f) => f.id === food.id);
    const text = index !== -1 ? `🟢 ${index + 1}. ${food.title}` : `⚪️ ${food.title}`;
    return [
      {
        text,
        callback_data: `FOOD_TOGGLE:${food.id}`,
      },
    ];
  });

  keyboard.push([
    { text: "🔙 بازگشت", callback_data: "BACK" },
    { text: "✅ ثبت نهایی", callback_data: "FOOD_CONFIRM" },
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
        text: `${isSelected ? "✅ " : "❌ "}${day.title}`,
        callback_data: `DAY_TOGGLE:${day.id}`,
      },
    ];
  });

  buttons.push([
    { text: "🔙 بازگشت", callback_data: "BACK" },
    { text: "تأیید روزها ✅", callback_data: "DAYS_CONFIRM" },
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
  return `📅 روزهای انتخاب‌شده:\n${list}\n\nمی‌توانید روزهای دیگر را اضافه یا حذف کنید:`;
}

export function getNextSaturday() {
  const now = new Date();
  const day = now.getUTCDay();
  const diff = (6 - day + 7) % 7 || 7;
  const saturday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + diff));
  return `${saturday.getUTCFullYear()}-${String(saturday.getUTCMonth() + 1).padStart(2, "0")}-${String(saturday.getUTCDate()).padStart(2, "0")}+00:00:00`;
}

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
export function buildAccountKeyboard() {
  return {
    inline_keyboard: [[{ text: "👤 اطلاعات کاربری", callback_data: "ACCOUNT_INFO" }], [{ text: "✏️ ویرایش اطلاعات ورود", callback_data: "ACCOUNT_EDIT_LOGIN" }], [{ text: "🚪 خروج از حساب کاربری", callback_data: "ACCOUNT_LOGOUT" }], [{ text: "🔙 بازگشت", callback_data: "BACK" }]],
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
export function normalizeDays(value) {
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

export const ALLOWED_USERS = new Set([
  7672690394, 6789081090, 6380541321, 1294142200, 5172295118, 5611274321, 1794801892, 1129506561, 1144899446, 358114222, 6305899449, 1485455710, 661009969, 5422717034, 6717838393, 6113802539, 5401358599, 6493718498, 985677026, 5340478475, 1455558347, 1215651154, 8392658456,
  480225342, 1654053942, 7727591453, 7349894496, 6189662758, 618138833, 6129638645, 1985088412, 1360720393, 5393868617, 8231438658, 6350935813, 131618119, 1568641824, 8492180012, 7625892764, 5281617910, 6002878395, 5355895101, 720230451, 1831745322, 693464604, 6010801514,
  133999589, 1135773302, 1352697614, 5812623701, 448962281, 6641925712, 5788498184, 8093812189, 8499373497, 8459136776, 5128363658, 6231855439, 2136432772, 1100549924, 1811359942, 6868358536, 7567203821, 795414349, 7746902094, 1538217406, 7114718929, 7323402979, 5173727398,
  1346156292, 8309702087, 259904400, 1048856416, 1194580861, 683051084, 983426239, 6373851854, 2023069977, 508420637, 8147624583, 6766578299, 388376574, 1159440893, 1854079031, 8363319822, 1244350963, 8295420922, 1900006068, 2052969623, 1656070656, 7397732285, 1116515983,
  1529189498, 7487853442, 8127014786, 916036110, 8078529142, 6013807799, 6230723601, 709712212, 1145070412, 1936676861, 5754965025, 853618586, 5597397249, 387394348, 7289615356, 5352101828, 8425111960, 1698986835, 5916706222, 6613933863, 8116386345, 8007533740, 8152950546,
  72986574, 8305778555, 404623651, 274989966, 5220686671, 6964074021, 1069129572, 379075872, 1283173649, 851269421, 1585743540, 6215875760, 1856962525, 311474197, 1489335100, 1149150675, 1035537594, 1099766840, 5883998073, 887889261, 2020081564, 7959160092, 1497579437,
  1932202740, 1235496823, 343748856, 661659142, 1880349583, 5272970943, 2041637341, 5766849973, 1184861381, 5292504324, 5489299851, 903556263, 8225978255, 5829291278, 8128307442, 5358679218, 1118244666, 1145266637,
]);

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
