import cron from "node-cron";
import { checkNewWeek } from "./checker.js";
import { getAutoReserveUsers, getChannelNotifyState, getChannelWeekMenuState, setChannelNotifyState, setChannelWeekMenuState, setLastReservedWeek } from "../db/index.js";
import { reserveForUsers } from "./reserver.js";
import {
  buildWeekMenuFingerprint,
  buildWeekMenuRichMessage,
  editRichMessage,
  fetchAllSelvesWeekPrograms,
  formatLastCheckedProgram,
  getNextSaturday,
  getSamadAccessToken,
  getSelvesWithProgram,
  getVisibleDaysFa,
  isSelfOpenedInPanel,
  SAMAD_SELVES,
  sendRichMessage,
} from "../utils/index.js";
import { getSelfWeekPrograms } from "../api/services.js";
import { runWeeklyReminders } from "./reminders.js";
import config from "../config.js";

let running = false;

function channelText(html) {
  return String(html).replace(/<tg-emoji emoji-id="[^"]*">([\s\S]*?)<\/tg-emoji>/gi, "$1");
}

function formatEditTime() {
  return new Intl.DateTimeFormat("fa-IR", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}

function withEditTime(text, { rich = false } = {}) {
  const time = formatEditTime();
  if (rich) return `${String(text).trimEnd()}\n<p><i>آخرین ویرایش: ${time}</i></p>`;
  return `${String(text).trimEnd()}\n\n<i>آخرین ویرایش: ${time}</i>`;
}

async function fetchSelfStatuses(adminToken, weekStartDate) {
  const statuses = [];
  for (const self of SAMAD_SELVES) {
    try {
      const res = await getSelfWeekPrograms(adminToken, weekStartDate, self.id);
      const open = res?.status === 200 && isSelfOpenedInPanel(res.data);
      const daysFa = open ? getVisibleDaysFa(res.data) : [];
      statuses.push({ self, open, daysFa });
    } catch (e) {
      console.error("[CRON] fetch self failed:", self.id, e.message);
      statuses.push({ self, open: false, daysFa: [] });
    }
  }
  return statuses;
}

function buildWeekSummaryText(weekFa, statuses, botUsername) {
  const lines = statuses.map(({ self, open, daysFa }) => {
    if (!open) return `• ${self.title}: برنامه غذایی نیست ❌`;
    return `• ${self.title}: باز ✅ (${daysFa.length} روز)`;
  });

  return withEditTime(`<b>🍽 رزرو غذای این هفته باز شد</b>

📅 شروع هفته: <code>${weekFa}</code>

${lines.join("\n")}

🔗 سامانه سماد:
https://samad.app/

🤖 ربات: @${botUsername}`);
}

function buildSelfOpenedText(self, weekFa, daysFa, botUsername, { updated = false } = {}) {
  const daysLine = daysFa.length ? `\n📆 روزهای باز: <b>${daysFa.join("، ")}</b> (${daysFa.length} روز)` : "";
  const title = updated ? `سلف «<b>${self.title}</b>» به‌روزرسانی شد - روزهای بیشتری باز شد` : `سلف «<b>${self.title}</b>» باز شد`;

  return `🍽 ${title}

📅 هفته: <code>${weekFa}</code>${daysLine}

از همین الان می‌تونید در سامانه سماد رزرو کنید.

🔗 سامانه سماد:
https://samad.app/

🤖 ربات: @${botUsername}`;
}

function dayCountsFromOpened(opened) {
  const counts = {};
  for (const { self, daysFa } of opened) counts[self.id] = daysFa.length;
  return counts;
}

function countsChanged(prev, next) {
  const keys = new Set([...Object.keys(prev || {}), ...Object.keys(next || {})]);
  for (const k of keys) {
    if ((Number(prev?.[k]) || 0) !== (Number(next?.[k]) || 0)) return true;
  }
  return false;
}

// channel week menu
async function syncChannelWeekMenu(bot, adminToken, pool) {
  if (!config.CHANNEL_ID) {
    console.log("[CRON] CHANNEL_ID not set, skip week menu");
    return;
  }

  const weekStartDate = getNextSaturday();
  const bySelf = await fetchAllSelvesWeekPrograms(adminToken, weekStartDate);
  const withProgram = getSelvesWithProgram(bySelf);
  const selfCount = withProgram.length;
  const fingerprint = buildWeekMenuFingerprint(bySelf);
  const state = await getChannelWeekMenuState(pool, weekStartDate);

  if (!selfCount) {
    console.log("[CRON] week menu wait: no self with program yet");
    return;
  }

  const html = withEditTime(channelText(buildWeekMenuRichMessage(weekStartDate, bySelf)), { rich: true });

  if (!state.messageId) {
    const msg = await sendRichMessage(bot, config.CHANNEL_ID, html);
    const messageId = msg?.message_id;
    if (!messageId) {
      console.error("[CRON] week menu send failed: no message_id", msg);
      return;
    }
    await setChannelWeekMenuState(pool, weekStartDate, { messageId, fingerprint, selfCount });
    console.log("[CRON] week menu posted ✅ selves=", selfCount, "msg=", messageId);
    return;
  }

  if (state.fingerprint === fingerprint) {
    console.log("[CRON] week menu unchanged");
    return;
  }

  if (selfCount < state.selfCount) {
    console.log("[CRON] week menu selfCount decreased, skip edit");
    return;
  }

  try {
    await editRichMessage(bot, config.CHANNEL_ID, state.messageId, html);
    await setChannelWeekMenuState(pool, weekStartDate, {
      messageId: state.messageId,
      fingerprint,
      selfCount,
    });
    console.log("[CRON] week menu edited ✅ selves=", state.selfCount, "→", selfCount);
  } catch (e) {
    console.error("[CRON] week menu edit failed:", e.message);
    if (/message to edit not found|message can't be edited/i.test(e.message || "")) {
      const msg = await sendRichMessage(bot, config.CHANNEL_ID, html);
      const messageId = msg?.message_id;
      if (messageId) {
        await setChannelWeekMenuState(pool, weekStartDate, { messageId, fingerprint, selfCount });
        console.log("[CRON] week menu re-posted ✅ msg=", messageId);
      }
    }
  }
}

async function notifyNewlyOpenedSelves(bot, adminToken, pool) {
  if (!config.CHANNEL_ID) {
    console.log("[CRON] CHANNEL_ID not set, skip channel notify");
    return;
  }

  const weekStartDate = getNextSaturday();
  const weekFa = formatLastCheckedProgram(weekStartDate);
  const state = await getChannelNotifyState(pool, weekStartDate);
  const notifiedSet = new Set(state.ids);
  const dayCounts = { ...(state.dayCounts || {}) };
  const messageIds = { ...(state.messageIds || {}) };
  let summaryMessageId = state.summaryMessageId || null;

  let me;
  try {
    me = await bot.getMe();
  } catch (e) {
    console.error("[CRON] getMe failed:", e.message);
    return;
  }

  const statuses = await fetchSelfStatuses(adminToken, weekStartDate);
  const opened = statuses.filter((s) => s.open);
  if (!opened.length) {
    console.log("[CRON] no self open in panel yet");
    return;
  }

  const nextCounts = { ...dayCounts, ...dayCountsFromOpened(opened) };
  const summaryText = buildWeekSummaryText(weekFa, statuses, me.username);

  async function saveNotifyState(extra = {}) {
    await setChannelNotifyState(pool, weekStartDate, {
      summarySent: true,
      summaryMessageId,
      ids: [...notifiedSet],
      dayCounts,
      messageIds,
      ...extra,
    });
  }

  if (!state.summarySent) {
    if (state.ids.length > 0) {
      Object.assign(dayCounts, nextCounts);
      for (const id of state.ids) notifiedSet.add(id);
      await saveNotifyState();
      console.log("[CRON] channel summary skipped (legacy ids present), marked summarySent");
      return;
    }

    const msg = await bot.sendMessage(config.CHANNEL_ID, summaryText, {
      parse_mode: "HTML",
      disable_web_page_preview: true,
    });
    summaryMessageId = msg?.message_id || null;
    for (const { self, daysFa } of opened) {
      notifiedSet.add(self.id);
      dayCounts[self.id] = daysFa.length;
    }
    await saveNotifyState();
    console.log("[CRON] channel week summary ✅ open=", [...notifiedSet].join(","));
    return;
  }

  if (countsChanged(state.dayCounts, nextCounts)) {
    try {
      if (summaryMessageId) {
        await bot.editMessageText(summaryText, {
          chat_id: config.CHANNEL_ID,
          message_id: summaryMessageId,
          parse_mode: "HTML",
          disable_web_page_preview: true,
        });
        console.log("[CRON] channel week summary edited ✅");
      } else {
        const msg = await bot.sendMessage(config.CHANNEL_ID, summaryText, {
          parse_mode: "HTML",
          disable_web_page_preview: true,
        });
        summaryMessageId = msg?.message_id || null;
        console.log("[CRON] channel week summary posted (no prior id) ✅ msg=", summaryMessageId);
      }
    } catch (e) {
      console.error("[CRON] channel week summary update failed:", e.message);
      if (/message to edit not found|message can't be edited/i.test(e.message || "")) {
        try {
          const msg = await bot.sendMessage(config.CHANNEL_ID, summaryText, {
            parse_mode: "HTML",
            disable_web_page_preview: true,
          });
          summaryMessageId = msg?.message_id || summaryMessageId;
          console.log("[CRON] channel week summary re-posted ✅ msg=", summaryMessageId);
        } catch (sendErr) {
          console.error("[CRON] channel week summary re-post failed:", sendErr.message);
        }
      }
    }
  }

  for (const { self, daysFa } of opened) {
    const count = daysFa.length;
    const isNew = !notifiedSet.has(self.id);
    const hasTrackedCount = dayCounts[self.id] != null;
    const prevCount = hasTrackedCount ? Number(dayCounts[self.id]) || 0 : 0;

    if (!isNew && !hasTrackedCount) {
      dayCounts[self.id] = count;
      continue;
    }

    const expanded = !isNew && count > prevCount;
    if (!isNew && !expanded) continue;

    try {
      const prevMsgId = messageIds[self.id];
      if (prevMsgId) {
        await bot.deleteMessage(config.CHANNEL_ID, prevMsgId).catch(() => {});
      }

      const text = buildSelfOpenedText(self, weekFa, daysFa, me.username, { updated: expanded });
      const msg = await bot.sendMessage(config.CHANNEL_ID, text, {
        parse_mode: "HTML",
        disable_web_page_preview: true,
      });
      if (msg?.message_id) messageIds[self.id] = msg.message_id;
      notifiedSet.add(self.id);
      dayCounts[self.id] = count;
      console.log("[CRON] channel self", expanded ? "updated" : "opened", "✅", self.id, self.title, `days ${prevCount}→${count}`);
    } catch (e) {
      console.error("[CRON] channel self notify failed:", self.id, e.message);
    }
  }

  await saveNotifyState();
}

export function startAutoReserve(pool, bot) {
  // every sunday at 20:18
  cron.schedule(
    "34 20 * * 0",
    async () => {
      console.log("[REMIND] weekly tick", new Date().toISOString());
      try {
        await runWeeklyReminders(pool, bot);
      } catch (e) {
        console.error("[REMIND] error:", e);
      }
    },
    { timezone: "Asia/Tehran" },
  );

  // every 5 minutes

  cron.schedule("*/5 * * * *", async () => {
    console.log("[CRON] tick", new Date().toISOString());

    if (running) {
      console.log("[CRON] already running, skip");
      return;
    }
    running = true;

    try {
      const adminToken = await getSamadAccessToken(pool);
      if (!adminToken) {
        console.log("[CRON] no admin token");
        return;
      }

      await syncChannelWeekMenu(bot, adminToken, pool);
      await notifyNewlyOpenedSelves(bot, adminToken, pool);

      const result = await checkNewWeek(pool, adminToken);

      if (!result) {
        console.log("[CRON] no ready week for reserve yet");
        return;
      }

      console.log("[CRON] week:", result.weekStartDate, "isNewWeek:", result.isNewWeek);

      const users = await getAutoReserveUsers(pool, result.weekStartDate);
      console.log("[CRON] auto users:", users.length);
      await reserveForUsers(users, result.weekStartDate, pool, bot, adminToken);

      if (result.isNewWeek) {
        await setLastReservedWeek(pool, result.weekStartDate);
      }

      console.log("[CRON] reservation done ✅");
    } catch (e) {
      console.error("[CRON] error:", e);
    } finally {
      running = false;
    }
  });
}
