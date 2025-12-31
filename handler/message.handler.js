import { loginUser, reserveFood } from "../api/services.js";
import { getUser, saveSession } from "../db/index.js";
import TelegramBot from "node-telegram-bot-api";
import { backKeyboard, buildHomeKeyboard } from "../utils/index.js";
// import handleState from "./state.hander.js";

/**
 * @param {TelegramBot} bot
 * @param {import("node-telegram-bot-api").Message} msg
 */
export default async function handleMessage(bot, msg, pool, userState) {
  try {
    if (msg.chat.type !== "private") return;
    const fromId = msg.from.id;
    const text = msg.text?.trim();
    let user = await getUser(fromId, pool);
    if (!user) {
      await pool.query("INSERT INTO users (id) VALUES (?)", [fromId]);
    }

    switch (true) {
      case /^\/start(?:@\w+)?$/i.test(text):
        bot.sendMessage(
          fromId,
          `سلام
به ربات رزرو خودکار غذا از سایت سماد مخصوص دانشجویان شریف خوش آمدید

برای شروع یکی از دکمه های زیر را انتخاب کنید 👇 `,
          { reply_markup: buildHomeKeyboard(!!user.username) }
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
            saveSession(pool, fromId, text, state.data.username, res);
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
