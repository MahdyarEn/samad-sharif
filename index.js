import mysql from "mysql2/promise";
import TelegramBot from "node-telegram-bot-api";
import config from "./config.js";
import handleCallback from "./handler/callback.handler.js";
import handleMessage from "./handler/message.handler.js";
import { startAutoReserve } from "./auto/scheduler.js";

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
      CREATE TABLE IF NOT EXISTS system_state (
        \`key\` VARCHAR(50) NOT NULL,
        \`value\` TEXT,
        updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`key\`)
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(100) NOT NULL,

        username TEXT DEFAULT NULL,
        password TEXT DEFAULT NULL,

        access_token TEXT DEFAULT NULL,
        refresh_token TEXT DEFAULT NULL,

        expires_at DATETIME DEFAULT NULL,

        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
          ON UPDATE CURRENT_TIMESTAMP,

        food_priority JSON DEFAULT NULL,
        days JSON DEFAULT NULL,

        auto_reserve TINYINT(1) DEFAULT 1,
        last_checked_program DATETIME DEFAULT NULL,
        last_error_at DATETIME DEFAULT NULL,

        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    console.log("✅ MySQL connected");
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    process.exit(1);
  }
}
const bot = new TelegramBot(config.TOKEN, { polling: true });

async function startBot() {
  const userState = new Map();

  bot.on("message", (msg) => handleMessage(bot, msg, pool, userState));
  bot.on("callback_query", (query) => handleCallback(bot, query, pool, userState));

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
startAutoReserve(pool, bot);
run();
