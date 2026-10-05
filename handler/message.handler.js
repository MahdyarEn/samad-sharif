import { loginUser } from "../api/services.js";
import { getUser, saveSession } from "../db/index.js";
import { backKeyboard, buildHomeKeyboard, buildWelcomeMessage, isPriorityUser, sendRichMessage } from "../utils/index.js";

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
      user = await getUser(fromId, pool);
    }

    switch (true) {
      case /^\/start(?:@\w+)?$/i.test(text):
        await sendRichMessage(bot, fromId, buildWelcomeMessage(isPriorityUser(fromId)), {
          reply_markup: buildHomeKeyboard(!!user?.username),
        });
        break;
    }

    const state = userState.get(fromId);
    if (state) {
      switch (state.step) {
        case "LOGIN_USERNAME":
          state.data.username = text;
          state.step = "LOGIN_PASSWORD";
          await bot.sendMessage(fromId, `<tg-emoji emoji-id="5879895758202735862">🔒</tg-emoji> حالا پسورد اکانت سماد رو وارد کن:`, {
            reply_markup: backKeyboard(),
            parse_mode: "HTML",
          });
          return;

        case "LOGIN_PASSWORD":
          state.data.password = text;

          await bot.sendMessage(fromId, `<tg-emoji emoji-id="5451732530048802485">⏳</tg-emoji> در حال ورود...`, { parse_mode: "HTML" });

          const res = await loginUser(state.data.username, state.data.password, fromId, pool);

          if (res?.access_token) {
            saveSession(pool, fromId, state.data.username, text, res);
            await bot.sendMessage(
              fromId,
              `<tg-emoji emoji-id="5843528161278562947">✅</tg-emoji> ورود با موفقیت به اکانت شما انجام شد

<tg-emoji emoji-id="6039630677182254664">📂</tg-emoji> <b>اطلاعات کاربری شما</b>

<tg-emoji emoji-id="5879770735999717115">👤</tg-emoji> <b>نام و نام خانوادگی:</b> ${res.first_name} ${res.last_name}
<tg-emoji emoji-id="5920344347152224466">🧑‍💻</tg-emoji> <b>یوزرنیم اکانت سماد:</b> <span class="tg-spoiler">${state.data.username}</span>
<tg-emoji emoji-id="5472308992514464048">🔐</tg-emoji> <b>پسورد اکانت:</b> <span class="tg-spoiler">${text}</span>

<tg-emoji emoji-id="5881702736843511327">⚠️</tg-emoji> توجه داشته باشید که این اطلاعات صرفا برای ورود به سایت سماد استفاده میشوند و کاملا بصورت رمزگذاری شده ذخیره می‌شوند

حالا یکی از عملیات زیر را انتخاب کنید <tg-emoji emoji-id="5470177992950946662">👇</tg-emoji>`,
              { reply_markup: buildHomeKeyboard(true), parse_mode: "HTML" },
            );
            userState.delete(fromId);
          } else {
            userState.delete(fromId);
            await bot.sendMessage(fromId, `<tg-emoji emoji-id="5879813604068298387">⭕️</tg-emoji> اطلاعات کاربری وارد شده صحت ندارد، عملیات لغو شد.`, { reply_markup: buildHomeKeyboard(false), parse_mode: "HTML" });
          }

          return;
      }
    }
  } catch (error) {
    console.log(error);
  }
}
