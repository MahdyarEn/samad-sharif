import { ALLOWED_USERS, backKeyboard, buildAccountKeyboard, buildDaysKeyboard, buildDaysText, buildFoodKeyboard, buildHomeKeyboard, buildPreferenceText, DAYS, FOODS, normalizeDays } from "../utils/index.js";
import { getUser, logoutUser, saveDays, savefoodPriority, saveSession } from "../db/index.js";
import { fetchUserProfile, loginUser } from "../api/services.js";

export default async function handleCallback(bot, query, pool, userState) {
  const fromId = query.from.id;
  if (!ALLOWED_USERS.has(fromId)) {
    return bot.sendMessage(
      fromId,
      `⛔️ شما دسترسی استفاده از این ربات را ندارید
  این ربات تنها برای دانشجویان ورودی 1404 دانشکده کامپیوتر قابل استفاده می‌باشد.`
    );
  }
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
          foods: normalizeDays(user?.food_priority),
          days: [],
        };
        userState.set(fromId, state);
      }

      const msg_res = await bot.editMessageText(buildPreferenceText(fromId, FOODS, userState), {
        reply_markup: buildFoodKeyboard(fromId, FOODS, userState),
        message_id: messageId,
        chat_id: fromId,
      });
      await bot.sendMessage(
        fromId,
        `👈 لطفا غذاهای موردعلاقه خود را به ترتیب اولویت انتخاب کنید.

ربات در زمان رزرو از این اولویت‌ ها استفاده می‌کند.

 نیازی به انتخاب همه ۵۶ مورد نیست؛ انتخاب چند گزینه اصلی کافی است.

اگر در یک روز خاص هیچ‌کدام از اولویت‌های شما موجود نباشد، در صورت فعال بودن رزرو آن روز، ربات به‌صورت خودکار یک غذا را انتخاب می‌کند.`,
        {
          reply_to_message_id: msg_res.message_id,
        }
      );

      break;
    }

    case data.startsWith("FOOD_TOGGLE"): {
      const foodId = Number(data.split(":")[1]);
      const food = FOODS.find((f) => f.id === foodId);

      const exists = currentState.foods.find((f) => f.id === foodId);

      if (exists) {
        currentState.foods = currentState.foods.filter((f) => f.id !== foodId);
      } else {
        currentState.foods?.push({ id: food.id, title: food.title });
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

    case data === "FOOD_CONFIRM": {
      if (currentState.foods.length === 0) {
        return bot.answerCallbackQuery(query.id, {
          text: "حداقل یک غذا انتخاب کنید ❗",
          show_alert: true,
        });
      }

      await savefoodPriority(pool, fromId, currentState.foods);
      userState.delete(fromId);
      bot.deleteMessage(fromId, messageId);
      bot.deleteMessage(fromId, messageId + 1);
      await bot.sendMessage(
        fromId,
        `✅ ترجیحات غذایی شما ذخیره شد.

مرحله بعد را انتخاب کنید 👇`,
        { reply_markup: buildHomeKeyboard(true) }
      );
      break;
    }

    /* ================= DAYS SECTION ================= */

    case data === "MENU_RESERVE": {
      let state = userState.get(fromId);
      if (!state) {
        const user = await getUser(fromId, pool);
        state = {
          foods: [],
          days: normalizeDays(user?.days),
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

      const exists = currentState?.days?.find((d) => d.id === dayId);

      if (exists) {
        currentState.days = currentState.days.filter((d) => d.id !== dayId);
      } else {
        currentState.days?.push({ id: day.id, title: day.title, english: day.english });
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

    case data == "DAYS_CONFIRM": {
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
    case data === "MENU_ACCOUNT": {
      await bot.editMessageText("⚙️ مدیریت حساب کاربری\n\nلطفا یکی از گزینه‌های زیر را انتخاب کنید 👇", {
        chat_id: fromId,
        message_id: messageId,
        reply_markup: buildAccountKeyboard(),
      });
      break;
    }

    /* ================= ACCOUNT SECTION ================= */
    case data === "ACCOUNT_EDIT_LOGIN": {
      userState.set(fromId, {
        step: "LOGIN_USERNAME",
        data: {},
        mode: "EDIT",
      });

      await bot.editMessageText(
        `✏️ ویرایش اطلاعات ورود به سامانه سماد

👈 لطفا یوزرنیم جدید را وارد کنید
⚠️ اطلاعات قبلی جایگزین خواهند شد`,
        {
          chat_id: fromId,
          message_id: messageId,
          reply_markup: backKeyboard(),
        }
      );
      break;
    }

    case data === "ACCOUNT_LOGOUT": {
      await logoutUser(pool, fromId);
      userState.delete(fromId);

      await bot.editMessageText("✅ با موفقیت از حساب کاربری خارج شدید.\n\nبرای استفاده مجدد، دوباره وارد سامانه شوید 👇", {
        chat_id: fromId,
        message_id: messageId,
        reply_markup: buildHomeKeyboard(false),
      });
      break;
    }

    case data === "ACCOUNT_INFO": {
      try {
        const getUserInfo = await getUser(fromId, pool);

        let result = await fetchUserProfile(getUserInfo?.access_token);
        if (result.error_description == "Invalid access token") {
          const resalt2 = await loginUser(getUserInfo.username, getUserInfo.password, getUserInfo.id, pool);
          if (resalt2?.access_token) {
            saveSession(pool, getUserInfo.id, getUserInfo.password, getUserInfo.username, resalt2);
          }
          result = await fetchUserProfile(resalt2?.access_token);
        }

        if (result.error_description == "Invalid access token") {
          await logoutUser(pool, fromId);
          userState.delete(fromId);

          return await bot.editMessageText(`شما رمز حساب خود را عوض کردید، لطفا مجدد لاگین کنید`, {
            chat_id: fromId,
            message_id: messageId,
            parse_mode: "Markdown",
            reply_markup: buildHomeKeyboard(false),
          });
        }

        const profile = result.payload;
        const user = profile.user;

        const message = `👤 *اطلاعات کاربری سماد*

▫️ نام: *${user.firstName}*
▫️ نام خانوادگی: *${user.lastName}*
▫️ نام کاربری: \`${user.username}\`

💳 *اعتبار کیف پول:* ${Number(profile.credit / 10).toLocaleString()} تومان`;

        await bot.editMessageText(message, {
          chat_id: fromId,
          message_id: messageId,
          parse_mode: "Markdown",
          reply_markup: buildAccountKeyboard(),
        });
      } catch (err) {
        console.error("[ACCOUNT_INFO ERROR]", err);

        await bot.answerCallbackQuery(query.id, {
          text: "❌ دریافت اطلاعات کاربری با خطا مواجه شد",
          show_alert: true,
        });
      }
      break;
    }
    /* ================= HELP SECTION ================= */
    case data === "HELP":
      {
        const helpText = `
<b>🤖 این ربات چطور کار می‌کنه؟</b>
این ربات به‌صورت خودکار سامانه <b>سماد</b> رو بررسی می‌کنه و به محض باز شدن غذا، برای همه کاربران بر اساس تنظیمات و سلیقه‌شون غذا رو رزرو می‌کنه.

<b>⚠️ توجه:</b>
حساب شما در سماد باید شارژ شده و موجودی کافی داشته باشه.

<b>🍽 این ربات به چه دردی می‌خوره؟</b>
با این ربات می‌تونید غذای سلف رو به‌صورت خودکار
و دقیقا طبق علاقه‌تون رزرو کنید.

<b>⚡️ مزیت نسبت به رزرو دستی چیه؟</b>
• غذاهای کاله ظرفیت محدود دارن و خیلی زود پر می‌شن ربات، در لحظه باز شدن رزرو می‌کنه
• اگه یک روز فراموش کنید غذا رزرو کنید ربات خودکار براتون انجامش می‌ده

<b>🔐 اطلاعات من در خطر نیست؟</b>
این پروژه Open Source هست و کامل روی <b>GitHub</b> منتشر شده.
تمام اطلاعات حساس شما به‌صورت رمزگذاری‌شده در دیتابیس ذخیره می‌شن
و هر زمان خواستید می‌تونید سورس کد رو بررسی کنید.
`;
        await bot.editMessageText(helpText, {
          chat_id: fromId,
          message_id: messageId,
          reply_markup: backKeyboard(),
          parse_mode: "HTML",
        });
      }
      break;
  }
}
