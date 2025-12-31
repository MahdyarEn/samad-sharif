import mysql from "mysql2/promise";
import TelegramBot from "node-telegram-bot-api";
import config from "./config.js";
import handleCallback from "./handler/callback.handler.js";
import handleMessage from "./handler/message.handler.js";

const pool = mysql.createPool({
  host: "localhost",
  user: config.MYSQL_USER,
  password: config.MYSQL_PASSWORD,
  database: config.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
});

async function initDb() {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY,

        username VARCHAR(100) DEFAULT NULL,
        password VARCHAR(100) DEFAULT NULL,

        access_token TEXT DEFAULT NULL,
        refresh_token TEXT DEFAULT NULL,

        expires_at DATETIME DEFAULT NULL,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP
      )`);
    console.log("✅ MySQL connected");
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
}

async function startBot() {
  const bot = new TelegramBot(config.TOKEN, { polling: true });

  bot.on("message", (msg) => handleMessage(bot, msg, pool));
  bot.on("callback_query", (query) => handleCallback(bot, query, pool));

  const me = await bot.getMe();
  console.log(`🤖 Bot started: @${me.username}`);
  return bot;
}

async function run() {
  try {
    await initDb();
    await startBot();
  } catch (err) {
    console.error("❌ Run failed:", err);
    process.exit(1);
  }
}

run();
