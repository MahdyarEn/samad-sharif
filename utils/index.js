export function getProgramByFoodName(programs, foodName) {
  for (const dayPrograms of programs) {
    for (const program of dayPrograms) {
      if (program.foodName === foodName) {
        return program;
      }
    }
  }
  return null;
}

export function buildHomeKeyboard(isLogined) {
  if (!isLogined)
    return {
      inline_keyboard: [[{ text: "🔐 ورود به سامانه", callback_data: `LOGIN_SAMAD` }], [{ text: "ℹ️ راهنما", callback_data: `help` }]],
    };

  return {
    inline_keyboard: [
      [
        { text: "📋 انتخاب روز های رزرو", callback_data: `MENU_RESERVE` },
        { text: "⭐ انتخاب اولویت غذا", callback_data: `MENU_PREFERENCE` },
      ],
      [
        { text: "📅 وضعیت رزروهای من", callback_data: "MENU_STATUS" },
        { text: "⚙️ حساب کاربری", callback_data: "MENU_ACCOUNT" },
      ],
      [{ text: "ℹ️ راهنما", callback_data: `help` }],
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
  { id: 2, title: "چلو جوجه‌کباب" },
  { id: 3, title: "چلوکباب کوبیده (کاله)" },
  { id: 4, title: "چلو جوجه کباب (کاله)" },
  { id: 5, title: "خوراک جوجه چینی" },
  { id: 6, title: "خوراک ماکارونی با گوشت" },
  { id: 7, title: "سینی ماکارونی و ناگت (کاله)" },
  { id: 8, title: "عدس‌پلو با گوشت" },
  { id: 9, title: "چلوخورش قرمه سبزی (کاله)" },
  { id: 10, title: "لوبیاپلو با گوشت تکه (کاله)" },
  { id: 11, title: "استامبولی پلو با گوشت" },
  { id: 12, title: "چلو‌خورش قورمه‌سبزی" },
  { id: 13, title: "زرشک‌پلو با مرغ" },
  { id: 14, title: "زرشک پلو با مرغ (کاله)" },
  { id: 15, title: "چلوخورش فسنجان با مرغ" },
  { id: 16, title: "رشته پلو با گوشت" },
  { id: 17, title: "سینی خوراک بندری (کاله)" },
  { id: 18, title: "خوراک کوردن بلو" },
  { id: 19, title: "شنیتسل مرغ با برنج" },
  { id: 20, title: "خوراک کوکو سیب‌زمینی" },
  { id: 21, title: "خوراک کوکو سبزی" },
  { id: 22, title: "خوراک شنیتسل مرغ" },
  { id: 23, title: "چلو با شامی کباب" },
  { id: 24, title: "خوراک کتلت" },
  { id: 25, title: "سینی پیتزا و کراکت (کاله)" },
  { id: 26, title: "پیتزا مخلوط (کاله)" },
  { id: 27, title: "سینی فیله سوخاری و فلافل (کاله)" },
  { id: 28, title: "خوراک فلافل" },
  { id: 29, title: "سینی دونر و فلافل (کاله)" },
  { id: 30, title: "سینی خوراک فلافل (کاله)" },
  { id: 31, title: "سینی املت و نرگسی (کاله)" },
  { id: 32, title: "چلو‌خورش لوبیا‌ سبز" },
  { id: 33, title: "چلو با تن ماهی" },
  { id: 34, title: "سبزی پلو با تن ماهی" },
  { id: 35, title: "چلو‌خورش قیمه‌بادمجان" },
  { id: 36, title: "چلو خورشت مسما بادمجان" },
  { id: 37, title: "چلو‌خورش کرفس" },
  { id: 38, title: "چلوخورشت آلو اسفناج" },
  { id: 39, title: "چلو‌خورش قیمه‌ سیب زمینی" },
  { id: 40, title: "چلوکباب نگین دار" },
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

  return `✅ انتخاب فعلی شما (به ترتیب اولویت):\n\n${lines.join("\n")}\n\n👇 برای تغییر، روی دکمه‌ها بزن`;
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
  { id: 0, title: "شنبه" },
  { id: 1, title: "یکشنبه" },
  { id: 2, title: "دوشنبه" },
  { id: 3, title: "سه‌شنبه" },
  { id: 4, title: "چهارشنبه" },
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
    return "📅 هنوز روزی انتخاب نکرده‌اید.\nروزهای مورد نظر خود را انتخاب کنید:";
  }

  const list = selectedDays.map((d) => `• ${d.title}`).join("\n");
  return `📅 روزهای انتخاب‌شده:\n${list}\n\nمی‌توانید روزهای دیگر را اضافه یا حذف کنید:`;
}
