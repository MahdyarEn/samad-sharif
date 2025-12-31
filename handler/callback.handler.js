import TelegramBot from "node-telegram-bot-api";
import { backKeyboard, buildFoodKeyboard, buildHomeKeyboard, buildPreferenceText, FOODS } from "../utils/index.js";
import { getUser } from "../db/index.js";

/**
 * @param {TelegramBot} bot
 * @param {import("node-telegram-bot-api").Message} msg
 */
export default async function handleCallback(bot, query, pool, userState) {
  const fromId = query.from.id;
  const messageId = query.message.message_id;
  const data = query.data;
  let current = userState.get(fromId) || [];
  switch (true) {
    case data == "BACK":
      let user = await getUser(fromId, pool);
      bot.deleteMessage(fromId, messageId);
      bot.sendMessage(
        fromId,
        `به منوی اصلی بازگشتید

لطفا یکی از عملیات زیر را انتخاب کنید 👇`,
        { reply_markup: buildHomeKeyboard(!!user.username) }
      );
      userState.delete(fromId);
      break;

    case data == "LOGIN_SAMAD":
      userState.set(fromId, {
        step: "LOGIN_USERNAME",
        data: {},
      });
      bot.editMessageText(
        ` 👈  لطفا یوزرنیم اکانت سماد خودتون رو با دقت وارد کنید.

⚠️ توجه داشته باشید که این اطلاعات صرفا برای ورود به سایت سماد استفاده میشوند و کاملا بصورت رمزگذاری شده ذخیره می‌شوند`,
        { reply_markup: backKeyboard(), message_id: messageId, chat_id: fromId }
      );
      break;
  }
}
