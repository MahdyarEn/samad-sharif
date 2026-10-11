import { getUser, logoutUser, saveDays, savefoodPriority, saveSession, setAutoReserve, setForceReserve, setWaitSelves } from "../db/index.js";
import { backKeyboard, buildAccountKeyboard, buildDaysKeyboard, buildDaysText, buildFoodKeyboard, buildHomeKeyboard, buildPreferenceText, buildSettingsKeyboard, buildSettingsText, DAYS, FOODS, normalizeArray, normalizeWaitSelves, SAMAD_SELVES } from "../utils/index.js";
import { fetchUserProfile, isBadCredentials, isInvalidToken, loginUser } from "../api/services.js";

export default async function handleCallback(bot, query, pool, userState) {
  const fromId = query.from.id;
  const messageId = query.message.message_id;
  const data = query.data;
  let answered = false;

  const answer = async (opts) => {
    if (answered) return;
    answered = true;
    await bot.answerCallbackQuery(query.id, opts).catch(() => {});
  };

  let currentState = userState.get(fromId) || { foods: [], days: [] };

  try {
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
          foodCategory: null,
        };
        userState.set(fromId, state);
      } else {
        state.foodCategory = null;
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

ابتدا یک دسته را باز کنید، غذاها را انتخاب کنید، بعد می‌توانید به دسته‌های دیگر بروید.

 نیازی به انتخاب همه موارد نیست؛ انتخاب چند گزینه اصلی کافی است.

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
        currentState.foods?.push({ id: food.id, title: food.title, price: food.price });
      }

      userState.set(fromId, currentState);

      await bot.editMessageText(buildPreferenceText(fromId, FOODS, userState), {
        chat_id: fromId,
        message_id: messageId,
        reply_markup: buildFoodKeyboard(fromId, FOODS, userState),
        parse_mode: "HTML",
      });
      break;
    }

    case data === "FOOD_CAT_HOME": {
      currentState.foodCategory = null;
      userState.set(fromId, currentState);
      await bot.editMessageText(buildPreferenceText(fromId, FOODS, userState), {
        chat_id: fromId,
        message_id: messageId,
        reply_markup: buildFoodKeyboard(fromId, FOODS, userState),
        parse_mode: "HTML",
      });
      break;
    }

    case data.startsWith("FOOD_CAT:"): {
      const catId = data.split(":")[1];
      currentState.foodCategory = catId;
      userState.set(fromId, currentState);
      await bot.editMessageText(buildPreferenceText(fromId, FOODS, userState), {
        chat_id: fromId,
        message_id: messageId,
        reply_markup: buildFoodKeyboard(fromId, FOODS, userState),
        parse_mode: "HTML",
      });
      break;
    }

    case data === "FOOD_CONFIRM": {
      if (currentState.foods.length === 0) {
        await answer({
          text: "حداقل یک غذا انتخاب کنید ❗",
          show_alert: true,
        });
        return;
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
      break;
    }

    case data === "DAYS_CONFIRM": {
      if (currentState.days.length === 0) {
        await answer({
          text: "حداقل یک روز انتخاب کن ❗",
          show_alert: true,
        });
        return;
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
      await answer({
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
      await answer({
        text: next ? "رزرو اجباری روشن شد ✅" : "رزرو اجباری خاموش شد ❌",
      });
      break;
    }

    case data === "SETTINGS_SELVES_INFO": {
      await answer({
        text: "رزرو فقط بعد از آماده‌شدن سلف‌های انتخابی شروع می‌شود",
        show_alert: false,
      });
      break;
    }

    case data.startsWith("SETTINGS_TOGGLE_SELF:"): {
      const selfId = Number(data.split(":")[1]);
      if (!SAMAD_SELVES.some((s) => s.id === selfId)) break;
      const user = await getUser(fromId, pool);
      let wait = normalizeWaitSelves(user?.wait_selves);
      if (wait.includes(selfId)) {
        wait = wait.filter((id) => id !== selfId);
      } else {
        wait = [...wait, selfId];
      }
      wait = normalizeWaitSelves(wait);
      await setWaitSelves(pool, fromId, wait);
      const updated = await getUser(fromId, pool);

      await bot.editMessageText(buildSettingsText(updated), {
        chat_id: fromId,
        message_id: messageId,
        reply_markup: buildSettingsKeyboard(updated),
        parse_mode: "HTML",
      });
      const selfTitle = SAMAD_SELVES.find((s) => s.id === selfId)?.title || String(selfId);
      const nowOn = normalizeWaitSelves(updated?.wait_selves).includes(selfId);
      await answer({
        text: nowOn ? `${selfTitle} اضافه شد ✅` : `${selfTitle} برداشته شد`,
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

      await bot.editMessageText(
        `<tg-emoji emoji-id="5260726538302660868">✅</tg-emoji> با موفقیت از حساب کاربری خارج شدید.

برای استفاده مجدد، دوباره وارد سامانه شوید <tg-emoji emoji-id="5470177992950946662">👇</tg-emoji>`,
        {
          chat_id: fromId,
          message_id: messageId,
          reply_markup: buildHomeKeyboard(false),
          parse_mode: "HTML",
        },
      );
      break;
    }

    case data === "ACCOUNT_INFO": {
      let loadingId = null;
      try {
        await bot.deleteMessage(fromId, messageId).catch(() => {});
        const loadingMsg = await bot.sendMessage(
          fromId,
          `<tg-emoji emoji-id="5258113901106580375">⌛️</tg-emoji> درحال دریافت اطلاعات اکانت شما...`,
          { parse_mode: "HTML" },
        );
        loadingId = loadingMsg.message_id;

        const getUserInfo = await getUser(fromId, pool);

        let result = await fetchUserProfile(getUserInfo?.access_token).catch(() => null);
        if (isInvalidToken(result)) {
          let login;
          try {
            login = await loginUser(getUserInfo.username, getUserInfo.password);
          } catch (loginErr) {
            console.error("[ACCOUNT_INFO] login unavailable", loginErr?.message || loginErr);
            await bot.editMessageText(`<tg-emoji emoji-id="5879813604068298387">⭕️</tg-emoji> سماد موقتا در دسترس نیست، بعدا دوباره تلاش کنید.`, {
              chat_id: fromId,
              message_id: loadingId,
              parse_mode: "HTML",
              reply_markup: buildAccountKeyboard(),
            });
            return;
          }

          if (login?.access_token) {
            await saveSession(pool, getUserInfo.id, getUserInfo.username, getUserInfo.password, login);
            result = await fetchUserProfile(login.access_token).catch(() => null);
          } else if (isBadCredentials(login)) {
            await logoutUser(pool, fromId);
            userState.delete(fromId);
            await bot.editMessageText(
              `<tg-emoji emoji-id="5879813604068298387">⭕️</tg-emoji> ورود به سماد با رمز ذخیره‌شده ممکن نشد.

رمز عبور سماد اشتباه است؛ لطفا دوباره لاگین کنید.`,
              {
                chat_id: fromId,
                message_id: loadingId,
                parse_mode: "HTML",
                reply_markup: buildHomeKeyboard(false),
              },
            );
            return;
          } else {
            await bot.editMessageText(`<tg-emoji emoji-id="5879813604068298387">⭕️</tg-emoji> سماد موقتا در دسترس نیست، بعدا دوباره تلاش کنید.`, {
              chat_id: fromId,
              message_id: loadingId,
              parse_mode: "HTML",
              reply_markup: buildAccountKeyboard(),
            });
            return;
          }
        }

        const profile = result?.payload;
        const user = profile?.user;
        if (!profile || !user) {
          await bot.editMessageText(`<tg-emoji emoji-id="5879813604068298387">⭕️</tg-emoji> دریافت اطلاعات کاربری ممکن نشد، بعدا دوباره تلاش کنید.`, {
            chat_id: fromId,
            message_id: loadingId,
            parse_mode: "HTML",
            reply_markup: buildAccountKeyboard(),
          });
          return;
        }

        const message = `<tg-emoji emoji-id="6032693626394382504">👤</tg-emoji> <b>اطلاعات کاربری سماد</b>

<tg-emoji emoji-id="5850693253355017860">#️⃣</tg-emoji> نام: <b>${user.firstName}</b>
<tg-emoji emoji-id="5850693253355017860">#️⃣</tg-emoji> نام خانوادگی: <b>${user.lastName}</b>
<tg-emoji emoji-id="5850693253355017860">#️⃣</tg-emoji> نام کاربری: <code>${user.username}</code>

<tg-emoji emoji-id="5212962322967966165">💳</tg-emoji> <b>اعتبار کیف پول:</b> ${Number(profile.credit / 10).toLocaleString()} تومان`;

        await bot.editMessageText(message, {
          chat_id: fromId,
          message_id: loadingId,
          parse_mode: "HTML",
          reply_markup: buildAccountKeyboard(),
        });
      } catch (err) {
        console.error("[ACCOUNT_INFO ERROR]", err);
        if (loadingId) {
          await bot
            .editMessageText(`<tg-emoji emoji-id="5879813604068298387">⭕️</tg-emoji> دریافت اطلاعات کاربری با خطا مواجه شد.`, {
              chat_id: fromId,
              message_id: loadingId,
              parse_mode: "HTML",
              reply_markup: buildAccountKeyboard(),
            })
            .catch(() => {});
        } else {
          await answer({
            text: "❌ دریافت اطلاعات کاربری با خطا مواجه شد",
            show_alert: true,
          });
        }
      }
      break;
    }
    /* ================= HELP SECTION ================= */
    case data === "HELP":
      {
        const helpText = `<tg-emoji emoji-id="5372981976804366741">🤖</tg-emoji> <b>راهنمای ربات</b>
این ربات سامانه سماد رو به‌صورت خودکار چک می‌کنه و به‌محض باز شدن رزرو، طبق اولویت غذایی و روزهایی که انتخاب کردید براتون غذا رزرو می‌کنه تا غذاهای پرطرفدار جا نمونید و روزی رو فراموش نکنید.

<tg-emoji emoji-id="5359678839591018693">🍽</tg-emoji> <b>سلف‌های پشتیبانی‌شده</b>
سلف مرکزی / کاله، فست‌فود شریف و کلین‌فود (شامل غذای سلف، کاله، یونی‌فود، کلانا و …).

<tg-emoji emoji-id="5226512880362332956">📖</tg-emoji> <b>شروع کار</b>
۱. ورود به سامانه سماد
۲. انتخاب حداقل یک روز و اولویت غذاها
۳. در تنظیمات، رزرو خودکار رو روشن کنید

<tg-emoji emoji-id="5818705028424141605">⚙️</tg-emoji> <b>تنظیمات مهم</b>
• <b>رزرو خودکار:</b> روشن باشد تا ربات براتون رزرو کند
• <b>رزرو اجباری:</b> اگر اولویت‌هاتون نبود/پر شد، از بقیه غذاهای همان روز امتحان می‌کند
• <b>شروع پس از آماده‌شدن سلف:</b> می‌توانید مشخص کنید رزرو فقط بعد از آماده‌شدن سلف‌های انتخابی شروع شود

<tg-emoji emoji-id="5213181173026533794">⚠️</tg-emoji> حساب سماد باید شارژ کافی داشته باشد.

<tg-emoji emoji-id="5472308992514464048">🔐</tg-emoji> پروژه اوپن‌سورس است و اطلاعات حساس رمزگذاری می‌شوند:
https://github.com/MahdyarEn/samad-sharif
اگر براتون مفید بود، با «<tg-emoji emoji-id="5463289097336405244">⭐️</tg-emoji>» حمایت کنید.`;
        await bot.editMessageText(helpText, {
          chat_id: fromId,
          message_id: messageId,
          reply_markup: backKeyboard(),
          parse_mode: "HTML",
        });
      }
      break;
    }
  } finally {
    await answer();
  }
}
