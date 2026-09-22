import { ALLOWED_USERS, backKeyboard, buildAccountKeyboard, buildDaysKeyboard, buildDaysText, buildFoodKeyboard, buildHomeKeyboard, buildPreferenceText, buildSettingsKeyboard, buildSettingsText, DAYS, FOODS, normalizeArray } from "../utils/index.js";
import { getUser, logoutUser, saveDays, savefoodPriority, saveSession, setAutoReserve, setForceReserve } from "../db/index.js";
import { fetchUserProfile, loginUser } from "../api/services.js";

export default async function handleCallback(bot, query, pool, userState) {
  const fromId = query.from.id;
  if (!ALLOWED_USERS.has(fromId)) {
    return bot.sendMessage(
      fromId,
      `<tg-emoji emoji-id="5017122105011995219">⛔️</tg-emoji> شما دسترسی استفاده از این ربات را ندارید
  این ربات تنها برای دانشجویان ورودی 1404 دانشکده کامپیوتر قابل استفاده می‌باشد.`,
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
      await bot.sendMessage(fromId, `<tg-emoji emoji-id="6042137469204303531">🏠</tg-emoji> به منوی اصلی بازگشتید`, { reply_markup: buildHomeKeyboard(!!user.username), parse_mode: "HTML" });
      break;
    }

    case data === "LOGIN_SAMAD":
      userState.set(fromId, { step: "LOGIN_USERNAME", data: {} });
      await bot.editMessageText(
        `<tg-emoji emoji-id="5469735272017043817">👈</tg-emoji> لطفا یوزرنیم اکانت سماد خود را وارد کنید

<tg-emoji emoji-id="5314346928660554905">⚠️</tg-emoji> اطلاعات شما به‌صورت رمزنگاری‌شده ذخیره می‌شود`,
        {
          chat_id: fromId,
          message_id: messageId,
          reply_markup: backKeyboard(),
          parse_mode: "HTML",
        },
      );
      break;

    /* ================= FOOD SECTION ================= */
    case data === "MENU_PREFERENCE": {
      let state = userState.get(fromId);

      if (!state) {
        const user = await getUser(fromId, pool);
        state = {
          foods: normalizeArray(user?.food_priority),
          days: [],
        };
        userState.set(fromId, state);
      }

      const msg_res = await bot.editMessageText(buildPreferenceText(fromId, FOODS, userState), {
        reply_markup: buildFoodKeyboard(fromId, FOODS, userState),
        message_id: messageId,
        chat_id: fromId,
        parse_mode: "HTML",
      });
      await bot.sendMessage(
        fromId,
        `<tg-emoji emoji-id="5469735272017043817">👈</tg-emoji> لطفا غذاهای موردعلاقه خود را به ترتیب اولویت انتخاب کنید.

ربات در زمان رزرو از این اولویت‌ ها استفاده می‌کند.

 نیازی به انتخاب همه ۵۶ مورد نیست؛ انتخاب چند گزینه اصلی کافی است.

اگر در یک روز خاص هیچ‌کدام از اولویت‌های شما موجود نباشد، در صورت روشن بودن «رزرو اجباری غذای روز» از تنظیمات، ربات از بقیه غذاهای همان روز امتحان می‌کند.`,
        {
          reply_to_message_id: msg_res.message_id,
          parse_mode: "HTML",
        },
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
        parse_mode: "HTML",
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
        `<tg-emoji emoji-id="5213302802205387293">✅</tg-emoji> ترجیحات غذایی شما ذخیره شد.

مرحله بعد را انتخاب کنید <tg-emoji emoji-id="5470177992950946662">👇</tg-emoji>`,
        { reply_markup: buildHomeKeyboard(true), parse_mode: "HTML" },
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
          days: normalizeArray(user?.days),
        };
        userState.set(fromId, state);
      }

      await bot.editMessageText(buildDaysText(fromId, DAYS, userState), {
        reply_markup: buildDaysKeyboard(fromId, DAYS, userState),
        chat_id: fromId,
        message_id: messageId,
        parse_mode: "HTML",
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
        parse_mode: "HTML",
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
        `<tg-emoji emoji-id="5213302802205387293">✅</tg-emoji> روزهای هفته برای رزرو غذا با موفقیت انتخاب شدند

مرحله بعد را انتخاب کنید <tg-emoji emoji-id="5470177992950946662">👇</tg-emoji>`,
        {
          chat_id: fromId,
          message_id: messageId,
          reply_markup: buildHomeKeyboard(true),
          parse_mode: "HTML",
        },
      );
      break;
    }
    case data === "MENU_ACCOUNT": {
      await bot.editMessageText("<tg-emoji emoji-id='5818705028424141605'>⚙️</tg-emoji> مدیریت حساب کاربری\n\nلطفا یکی از گزینه‌های زیر را انتخاب کنید <tg-emoji emoji-id='5470177992950946662'>👇</tg-emoji>", {
        chat_id: fromId,
        message_id: messageId,
        reply_markup: buildAccountKeyboard(),
        parse_mode: "HTML",
      });
      break;
    }

    /* ================= SETTINGS SECTION ================= */
    case data === "MENU_SETTINGS": {
      const user = await getUser(fromId, pool);
      await bot.editMessageText(buildSettingsText(user), {
        chat_id: fromId,
        message_id: messageId,
        reply_markup: buildSettingsKeyboard(user),
        parse_mode: "HTML",
      });
      break;
    }

    case data === "SETTINGS_TOGGLE_AUTO": {
      const user = await getUser(fromId, pool);
      const next = Number(user?.auto_reserve) === 1 ? 0 : 1;
      await setAutoReserve(pool, fromId, next);
      const updated = await getUser(fromId, pool);

      await bot.editMessageText(buildSettingsText(updated), {
        chat_id: fromId,
        message_id: messageId,
        reply_markup: buildSettingsKeyboard(updated),
        parse_mode: "HTML",
      });
      await bot.answerCallbackQuery(query.id, {
        text: next ? "رزرو خودکار روشن شد ✅" : "رزرو خودکار خاموش شد ❌",
      });
      break;
    }

    case data === "SETTINGS_TOGGLE_FORCE": {
      const user = await getUser(fromId, pool);
      const next = Number(user?.force_reserve) === 1 ? 0 : 1;
      await setForceReserve(pool, fromId, next);
      const updated = await getUser(fromId, pool);

      await bot.editMessageText(buildSettingsText(updated), {
        chat_id: fromId,
        message_id: messageId,
        reply_markup: buildSettingsKeyboard(updated),
        parse_mode: "HTML",
      });
      await bot.answerCallbackQuery(query.id, {
        text: next ? "رزرو اجباری روشن شد ✅" : "رزرو اجباری خاموش شد ❌",
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
        `<tg-emoji emoji-id="5956143844457189176">✏️</tg-emoji> ویرایش اطلاعات ورود به سامانه سماد

<tg-emoji emoji-id="5469735272017043817">👈</tg-emoji> لطفا یوزرنیم جدید را وارد کنید
<tg-emoji emoji-id="5314346928660554905">⚠️</tg-emoji> اطلاعات قبلی جایگزین خواهند شد`,
        {
          chat_id: fromId,
          message_id: messageId,
          reply_markup: backKeyboard(),
          parse_mode: "HTML",
        },
      );
      break;
    }

    case data === "ACCOUNT_LOGOUT": {
      await logoutUser(pool, fromId);
      userState.delete(fromId);

      await bot.editMessageText(`<tg-emoji emoji-id="5260726538302660868">✅</tg-emoji> با موفقیت از حساب کاربری خارج شدید.nnبرای استفاده مجدد، دوباره وارد سامانه شوید <tg-emoji emoji-id="5470177992950946662">👇</tg-emoji>`, {
        chat_id: fromId,
        message_id: messageId,
        reply_markup: buildHomeKeyboard(false),
        parse_mode: "HTML",
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

        const message = `<tg-emoji emoji-id="6032693626394382504">👤</tg-emoji> <b>اطلاعات کاربری سماد</b>

<tg-emoji emoji-id="5850693253355017860">#️⃣</tg-emoji> نام: <b>${user.firstName}</b>
<tg-emoji emoji-id="5850693253355017860">#️⃣</tg-emoji> نام خانوادگی: <b>${user.lastName}</b>
<tg-emoji emoji-id="5850693253355017860">#️⃣</tg-emoji> نام کاربری: <code>${user.username}</code>

<tg-emoji emoji-id="5212962322967966165">💳</tg-emoji> <b>اعتبار کیف پول:</b> ${Number(profile.credit / 10).toLocaleString()} تومان`;

        await bot.editMessageText(message, {
          chat_id: fromId,
          message_id: messageId,
          parse_mode: "HTML",
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
        const helpText = `<tg-emoji emoji-id="5372981976804366741">🤖</tg-emoji> این ربات چطور کار می‌کنه؟
این ربات به‌صورت خودکار سامانه سماد رو بررسی می‌کنه و به محض باز شدن غذا، برای همه کاربران بر اساس تنظیمات و سلیقه‌شون غذا رو رزرو می‌کنه.

<tg-emoji emoji-id="5213181173026533794">⚠️</tg-emoji> توجه:
حساب شما در سماد باید شارژ شده و موجودی کافی داشته باشه.

<tg-emoji emoji-id="5359678839591018693">🍽</tg-emoji> این ربات به چه دردی می‌خوره؟
با این ربات می‌تونید غذای سلف رو به‌صورت خودکار
و دقیقا طبق علاقه‌تون رزرو کنید.

<tg-emoji emoji-id="6006071378984308148">⚡️</tg-emoji> مزیت نسبت به رزرو دستی چیه؟
• غذاهای کاله ظرفیت محدود دارن و خیلی زود پر می‌شن ربات، در لحظه باز شدن رزرو می‌کنه
• اگه یک روز فراموش کنید غذا رزرو کنید ربات خودکار براتون انجامش می‌ده

<tg-emoji emoji-id="5472308992514464048">🔐</tg-emoji> اطلاعات من در خطر نیست؟
این پروژه Open Source هست و کامل روی GitHub<tg-emoji emoji-id="5294334197832362643">🐱</tg-emoji>  منتشر شده.
تمام اطلاعات حساس شما به‌صورت رمزگذاری‌شده در دیتابیس ذخیره می‌شن
و هر زمان خواستید می‌تونید سورس کد رو بررسی کنید.

https://github.com/MahdyarEn/samad-sharif
راستی اگه از این پروژه خوشتون اومد ممنون میشم با «<tg-emoji emoji-id="5463289097336405244">⭐️</tg-emoji>» دادن ازش حمایت کنید :)`;
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
