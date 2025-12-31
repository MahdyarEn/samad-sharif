import { loginUser, reserveFood } from "../api/services.js";
import { getUser, saveSession } from "../db/index.js";

export default async function handleMessage(bot, msg, pool) {
  try {
    if (msg.chat.type !== "private") return;
    const fromId = msg.from.id;
    const text = msg.text?.trim();
    let user = await getUser(fromId, pool);
    if (!user) {
      await pool.query("INSERT INTO users (id) VALUES (?)", [fromId]);
    }
  
  } catch (error) {
    console.log(error);
  }
}
