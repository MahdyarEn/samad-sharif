import { backKeyboard, buildDaysKeyboard, buildDaysText, buildFoodKeyboard, buildHomeKeyboard, buildPreferenceText, DAYS, FOODS } from "../utils/index.js";
import { getUser, saveDays, savefoodPriority } from "../db/index.js";


export default async function handleCallback(bot, query, pool, userState) {
  const fromId = query.from.id;
  const messageId = query.message.message_id;
  const data = query.data;

  let currentState = userState.get(fromId) || { foods: [], days: [] };

  switch (true) {
    case data === "BACK": {
      const user = await getUser(fromId, pool);
      userState.delete(fromId);

      await bot.deleteMessage(fromId, messageId);
      await bot.sendMessage(fromId, `به منوی اصلی بازگشتید 👇`, { reply_markup: buildHomeKeyboard(!!user.username) });
      break;
    }

    case data === "LOGIN_SAMAD":
      userState.set(fromId, { step: "LOGIN_USERNAME", data: {} });
      await bot.editMessageText(
        `👈 لطفا یوزرنیم اکانت سماد خود را وارد کنید

⚠️ اطلاعات شما به‌صورت رمزنگاری‌شده ذخیره می‌شود`,
        {
          chat_id: fromId,
          message_id: messageId,
          reply_markup: backKeyboard(),
        }
      );
      break;

    /* ================= FOOD SECTION ================= */
    case data === "MENU_PREFERENCE": {
      let state = userState.get(fromId);
      if (!state) {
        const user = await getUser(fromId, pool);
        state = {
          foods: Array.isArray(user?.food_priority) ? user.food_priority : [],
          days: [],
        };
        userState.set(fromId, state);
      }

      await bot.editMessageText(buildPreferenceText(fromId, FOODS, userState), {
        reply_markup: buildFoodKeyboard(fromId, FOODS, userState),
        message_id: messageId,
        chat_id: fromId,
      });

      break;
    }

    case data.startsWith("FOOD_TOGGLE"): {
      const foodId = Number(data.split(":")[1]);
      const food = FOODS.find((f) => f.id === foodId);

      const exists = currentState.foods.find((f) => f.id === foodId);

      if (exists) {
        currentState.foods = currentState.foods.filter((f) => f.id !== foodId);
      } else {
        currentState.foods.push({ id: food.id, title: food.title });
      }

      userState.set(fromId, currentState);

      await bot.editMessageText(buildPreferenceText(fromId, FOODS, userState), {
        chat_id: fromId,
        message_id: messageId,
        reply_markup: buildFoodKeyboard(fromId, FOODS, userState),
      });

      await bot.answerCallbackQuery(query.id);
      break;
    }

    case data === "FOOD_CONFIRM":
      if (currentState.foods.length === 0) {
        return bot.answerCallbackQuery(query.id, {
          text: "حداقل یک غذا انتخاب کنید ❗",
          show_alert: true,
        });
      }

      await savefoodPriority(pool, fromId, currentState.foods);
      userState.delete(fromId);

      await bot.editMessageText(
        `✅ ترجیحات غذایی شما ذخیره شد.

مرحله بعد را انتخاب کنید 👇`,
        {
          chat_id: fromId,
          message_id: messageId,
          reply_markup: buildHomeKeyboard(true),
        }
      );
      break;

    /* ================= DAYS SECTION ================= */

    case data === "MENU_RESERVE": {
      let state = userState.get(fromId);
      if (!state) {
        const user = await getUser(fromId, pool);
        state = {
          foods: [], 
          days: Array.isArray(user?.days) ? user.days : [],
        };
        userState.set(fromId, state);
      }

      await bot.editMessageText(buildDaysText(fromId, DAYS, userState), {
        reply_markup: buildDaysKeyboard(fromId, DAYS, userState),
        chat_id: fromId,
        message_id: messageId,
      });

      break;
    }

    case data.startsWith("DAY_TOGGLE"): {
      const dayId = Number(data.split(":")[1]);
      const day = DAYS.find((d) => d.id === dayId);

      const exists = currentState.days.find((d) => d.id === dayId);

      if (exists) {
        currentState.days = currentState.days.filter((d) => d.id !== dayId);
      } else {
        currentState.days.push({ id: day.id, title: day.title });
      }

      userState.set(fromId, currentState);

      await bot.editMessageText(buildDaysText(fromId, DAYS, userState), {
        chat_id: fromId,
        message_id: messageId,
        reply_markup: buildDaysKeyboard(fromId, DAYS, userState),
      });

      await bot.answerCallbackQuery(query.id);
      break;
    }

    case data == "DAYS_CONFIRM":
      if (currentState.days.length === 0) {
        return bot.answerCallbackQuery(query.id, {
          text: "حداقل یک روز انتخاب کن ❗",
          show_alert: true,
        });
      }
      await saveDays(pool, fromId, currentState.days);
      userState.delete(fromId);

      await bot.editMessageText(
        `✅ روزهای هفته برای رزرو غذا با موفقیت انتخاب شدند

مرحله بعد را انتخاب کنید 👇`,
        {
          chat_id: fromId,
          message_id: messageId,
          reply_markup: buildHomeKeyboard(true),
        }
      );
      break;
  }
}
