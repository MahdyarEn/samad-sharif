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

