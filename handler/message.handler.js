import { loginUser } from "../api/services.js";
import { getUser, saveSession } from "../db/index.js";
import { backKeyboard, buildHomeKeyboard } from "../utils/index.js";

export default async function handleMessage(bot, msg, pool, userState) {
  try {
    if (msg.chat.type !== "private") return;
    const fromId = msg.from.id;
    const text = msg.text?.trim();
    let user = await getUser(fromId, pool);
    if (!user) {
      await pool.query("INSERT INTO users (id,days) VALUES (?,?)", [
        fromId,
        JSON.stringify([
          {
            id: 0,
            title: "شنبه",
            english: "Saturday",
          },
          {
            id: 1,
            title: "یکشنبه",
            english: "Sunday",
          },
          {
            id: 2,
            title: "دوشنبه",
            english: "Monday",
          },
          {
            id: 3,
            title: "سه‌شنبه",
            english: "Tuesday",
          },
          {
            id: 4,
            title: "چهارشنبه",
            english: "Wednesday",
          },
        ]),
      ]);
    }

    switch (true) {
      case /^\/start(?:@\w+)?$/i.test(text):
        bot.sendMessage(
          fromId,
          `سلام
به ربات رزرو خودکار غذا از سایت سماد مخصوص دانشجویان شریف خوش آمدید

برای شروع یکی از دکمه های زیر را انتخاب کنید 👇 `,
          { reply_markup: buildHomeKeyboard(!!user?.username) }
        );

        break;
    }

    const state = userState.get(fromId);
    if (state) {
      switch (state.step) {
        case "LOGIN_USERNAME":
          state.data.username = text;
          state.step = "LOGIN_PASSWORD";
          await bot.sendMessage(fromId, "🔒 حالا پسورد اکانت سماد رو وارد کن:", { reply_markup: backKeyboard() });
          return;

        case "LOGIN_PASSWORD":
          state.data.password = text;

          await bot.sendMessage(fromId, "⏳ در حال ورود...");

          const res = await loginUser(state.data.username, state.data.password, fromId, pool);

          if (res?.access_token) {
            saveSession(pool, fromId, state.data.username, text, res);
            await bot.sendMessage(
              fromId,
              `✅ ورود با موفقیت به اکانت شما انجام شد

📂 <b>اطلاعات کاربری شما</b>

👤 <b>نام و نام خانوادگی:</b> ${res.first_name} ${res.last_name}
🧑‍💻 <b>یوزرنیم اکانت سماد:</b> <span class="tg-spoiler">${state.data.username}</span>
🔐 <b>پسورد اکانت:</b> <span class="tg-spoiler">${text}</span>

⚠️ توجه داشته باشید که این اطلاعات صرفا برای ورود به سایت سماد استفاده میشوند و کاملا بصورت رمزگذاری شده ذخیره می‌شوند

—
حالا یکی از عملیات زیر را انتخاب کنید 👇`,
              { reply_markup: buildHomeKeyboard(true), parse_mode: "HTML" }
            );
            userState.delete(fromId);
          } else {
            userState.delete(fromId);
            await bot.sendMessage(fromId, "⭕️ اطلاعات کاربری وارد شده صحت ندارد، عملیات لغو شد.", { reply_markup: buildHomeKeyboard(false) });
          }

          return;
      }
    }
  } catch (error) {
    console.log(error);
  }
}
