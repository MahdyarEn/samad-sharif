import { getSelfWeekPrograms, loginUser, reserveFood } from "../api/services.js";
import { clearReserveError, logoutUser, markReserveError, saveSession, setUserLastCheckedProgram } from "../db/index.js";
import { buildHomeKeyboard, sleep } from "../utils/index.js";

export async function reserveForUsers(users, weekStartDate, pool, bot) {
  for (const user of users) {
    let hasError = false;
    try {
      console.log('here');
      
      let apiResult = await getSelfWeekPrograms(user?.access_token, weekStartDate);
      if (apiResult?.data?.error_description == "Invalid access token") {
        const resalt = await loginUser(user.username, user.password, user.id, pool);
        if (resalt?.access_token) {
          saveSession(pool, user.id, user.password, user.username, resalt);
        }
        apiResult = apiResult = await getSelfWeekPrograms(resalt?.access_token, weekStartDate);
      }
      if (apiResult?.data?.error_description == "Invalid access token") {
        await logoutUser(pool, user.id);
        bot.sendMessage(user.id, `⭕️ رزرو غذا در سماد با خطا مواجد شد\nشما رمز اکانت خود را عوض کردید، لطفا مجددا در ربات لاگین کنید`, { reply_markup: buildHomeKeyboard(false), parse_mode: "HTML" });
        continue;
      }
      if (!apiResult?.data?.payload?.selfWeekPrograms || !Array.isArray(apiResult.data.payload.selfWeekPrograms)) {
        continue;
      }

      const allPrograms = apiResult.data.payload.selfWeekPrograms.flat();
      console.log(`AutoReserve user ${user.id}`);

      for (const day of user.days) {
        const dayPrograms = allPrograms.filter((p) => p.dayTranslated === day.english);

        for (const food of user.food_priority) {
          let program = dayPrograms.find((p) => p.foodName === food.title);

          if (!program) program = dayPrograms[0];
          if (!program) continue;

          let res = await reserveFood(user, program, apiResult.data.payload.selfWeekPrograms);

          await setUserLastCheckedProgram(user.id, weekStartDate, pool);

          if (res?.messageFa && res?.type == "ERROR") {
            if (res?.messageFa != "با توجه به قواعد و محدودیتها، هیچ موردی برای تغییر وجود ندارد.") {
              bot.sendMessage(user.id, `⭕️ رزرو غذا در سماد با خطا مواجد شد\nمتن خطا:‌ <blockquote>${res.messageFa}</blockquote>`, { parse_mode: "HTML" });
              hasError = true;
            }
          } else {
            console.log(`[RESERVE] user=${user.id} day=${day.title} food=${program.title}`);
            bot.sendMessage(
              user.id,
              `✅ غذای روز ${day.title} با موفقیت رزرو شد.

نام غذا: ${program.foodName}
هزینه غذا: ${Number(program.price / 10).toLocaleString()}`,
              { parse_mode: "HTML" }
            );
            break;
          }

          await sleep(300);
        }
      }
    } catch (e) {
      hasError = true;
      console.error(`[AUTO] ERROR user=${user.id}`, e);
    }

    if (hasError) {
      await markReserveError(user.id, pool);
    } else {
      await clearReserveError(user.id, pool);
    }
    await sleep(1000);
  }
}
