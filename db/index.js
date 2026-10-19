import { ensureEncrypted } from "../utils/cypto.js";

function sameWeekKey(a, b) {
  if (!a || !b) return false;
  return String(a).slice(0, 10) === String(b).slice(0, 10);
}

function parseJson(value, fallback) {
  if (value == null || value === "") return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function readReservedDaysState(raw, weekStartDate) {
  const state = parseJson(raw, null);
  if (!sameWeekKey(state?.week, weekStartDate)) {
    return { week: weekStartDate, days: [], attempts: {} };
  }
  const days = Array.isArray(state?.days) ? state.days.map(String) : [];
  const attempts = {};
  if (state?.attempts && typeof state.attempts === "object") {
    for (const [k, v] of Object.entries(state.attempts)) {
      const n = Number(v);
      if (k && Number.isFinite(n) && n > 0) attempts[k] = n;
    }
  }
  return { week: weekStartDate, days, attempts };
}

export function getPendingReserveDays(user, weekStartDate) {
  const wanted = Array.isArray(user?.days) ? user.days.filter((d) => d?.english) : [];
  if (!wanted.length) return [];
  if (sameWeekKey(user?.last_checked_program, weekStartDate)) return [];
  const reserved = new Set(readReservedDaysState(user?.reserved_days, weekStartDate).days);
  return wanted.filter((d) => !reserved.has(d.english));
}

export async function getUser(id, pool) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
}
export async function saveSession(pool, telegramId, username, password, session) {
  username = ensureEncrypted(username);
  password = ensureEncrypted(password);
  const expiresAt = session.expires_in ? new Date(Date.now() + session.expires_in * 1000) : null;
  await pool.query(
    `
    UPDATE users
    SET
      username = ?,
      password = ?,
      access_token = ?,
      refresh_token = ?,
      expires_at = ?
    WHERE id = ?
    `,
    [username, password, session.access_token ?? null, session.refresh_token ?? null, expiresAt, telegramId]
  );
}
export async function savefoodPriority(pool, userId, food_priority) {
  await pool.query("UPDATE users SET food_priority = ? WHERE id = ?", [JSON.stringify(food_priority), userId]);
}
export async function saveDays(pool, userId, days) {
  await pool.query("UPDATE users SET days = ? WHERE id = ?", [JSON.stringify(days), userId]);
}

export async function getLoggedInUsers(pool) {
  const [rows] = await pool.query(`
SELECT id, username, password, access_token, auto_reserve, force_reserve, wait_selves, food_priority, days
FROM users
WHERE username IS NOT NULL
  AND username <> ''
`);
  return rows;
}

export async function getAutoReserveUsers(pool, weekStartDate) {
  const weekKey = String(weekStartDate || "").slice(0, 10);
  if (!weekKey) return [];

  const [rows] = await pool.query(
    `
SELECT *
FROM users
WHERE auto_reserve = 1
  AND username IS NOT NULL
  AND username <> ''
  AND food_priority IS NOT NULL
  AND food_priority <> ''
  AND (
    last_checked_program IS NULL
    OR DATE(last_checked_program) <> ?
  )
  `,
    [weekKey],
  );

  return rows
    .map((u) => {
      const wait = parseJson(u.wait_selves, [1]);
      return {
        id: u.id,
        username: u.username,
        password: u.password,
        access_token: u.access_token,
        created_at: u.created_at,
        last_checked_program: u.last_checked_program,
        reserved_days: parseJson(u.reserved_days, null),
        food_priority: parseJson(u.food_priority, []) || [],
        days: parseJson(u.days, []) || [],
        force_reserve: Number(u.force_reserve) === 1,
        wait_selves: Array.isArray(wait) && wait.length ? wait.map(Number) : [1],
      };
    })
    .filter((u) => getPendingReserveDays(u, weekStartDate).length > 0);
}

export async function setAutoReserve(pool, userId, enabled) {
  await pool.query("UPDATE users SET auto_reserve = ? WHERE id = ?", [enabled ? 1 : 0, userId]);
}

export async function setForceReserve(pool, userId, enabled) {
  await pool.query("UPDATE users SET force_reserve = ? WHERE id = ?", [enabled ? 1 : 0, userId]);
}

export async function setWaitSelves(pool, userId, selfIds) {
  let ids = Array.isArray(selfIds) ? selfIds.map(Number).filter((n) => [1, 2, 22, 23, 24, 25].includes(n)) : [];
  ids = [...new Set(ids)].map((id) => (id === 2 ? 1 : id));
  if (!ids.length) ids = [1];
  await pool.query("UPDATE users SET wait_selves = ? WHERE id = ?", [JSON.stringify(ids), userId]);
}

export async function getLastReservedWeek(pool) {
  const [rows] = await pool.query(`SELECT value FROM system_state WHERE \`key\`='last_reserved_week'`);
  return rows[0]?.value || null;
}

export async function setLastReservedWeek(pool, weekStartDate) {
  await pool.query(
    `REPLACE INTO system_state (\`key\`, value)
     VALUES ('last_reserved_week', ?)`,
    [weekStartDate]
  );
}

export async function getChannelNotifyState(pool, weekStartDate) {
  const [rows] = await pool.query(`SELECT value FROM system_state WHERE \`key\`='channel_notified_selves'`);
  const raw = rows[0]?.value;
  const empty = { summarySent: false, summaryMessageId: null, ids: [], dayCounts: {}, messageIds: {} };
  if (!raw) return empty;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!sameWeekKey(parsed?.week, weekStartDate)) return empty;
    const ids = Array.isArray(parsed?.ids) ? parsed.ids.map(Number).filter((n) => Number.isFinite(n)) : [];
    const dayCounts = {};
    if (parsed?.dayCounts && typeof parsed.dayCounts === "object") {
      for (const [k, v] of Object.entries(parsed.dayCounts)) {
        const id = Number(k);
        const n = Number(v);
        if (Number.isFinite(id) && Number.isFinite(n)) dayCounts[id] = n;
      }
    }
    const messageIds = {};
    if (parsed?.messageIds && typeof parsed.messageIds === "object") {
      for (const [k, v] of Object.entries(parsed.messageIds)) {
        const id = Number(k);
        const mid = Number(v);
        if (Number.isFinite(id) && Number.isFinite(mid)) messageIds[id] = mid;
      }
    }
    return {
      summarySent: !!parsed?.summarySent,
      summaryMessageId: parsed?.summaryMessageId != null ? Number(parsed.summaryMessageId) : null,
      ids,
      dayCounts,
      messageIds,
    };
  } catch {
    return empty;
  }
}

export async function setChannelNotifyState(
  pool,
  weekStartDate,
  { summarySent = false, summaryMessageId = null, ids = [], dayCounts = {}, messageIds = {} } = {},
) {
  const unique = [...new Set((ids || []).map(Number).filter((n) => Number.isFinite(n)))];
  const counts = {};
  for (const [k, v] of Object.entries(dayCounts || {})) {
    const id = Number(k);
    const n = Number(v);
    if (Number.isFinite(id) && Number.isFinite(n) && n > 0) counts[id] = n;
  }
  const msgs = {};
  for (const [k, v] of Object.entries(messageIds || {})) {
    const id = Number(k);
    const mid = Number(v);
    if (Number.isFinite(id) && Number.isFinite(mid)) msgs[id] = mid;
  }
  await pool.query(
    `REPLACE INTO system_state (\`key\`, value)
     VALUES ('channel_notified_selves', ?)`,
    [
      JSON.stringify({
        week: weekStartDate,
        summarySent: !!summarySent,
        summaryMessageId: summaryMessageId != null ? Number(summaryMessageId) : null,
        ids: unique,
        dayCounts: counts,
        messageIds: msgs,
      }),
    ],
  );
}

export async function getChannelWeekMenuState(pool, weekStartDate) {
  const [rows] = await pool.query(`SELECT value FROM system_state WHERE \`key\`='channel_week_menu'`);
  const raw = rows[0]?.value;
  const empty = { messageId: null, fingerprint: null, selfCount: 0 };
  if (!raw) return empty;
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!sameWeekKey(parsed?.week, weekStartDate)) return empty;
    return {
      messageId: parsed?.messageId != null ? Number(parsed.messageId) : null,
      fingerprint: parsed?.fingerprint || null,
      selfCount: Number(parsed?.selfCount) || 0,
    };
  } catch {
    return empty;
  }
}

export async function setChannelWeekMenuState(pool, weekStartDate, { messageId, fingerprint, selfCount } = {}) {
  await pool.query(
    `REPLACE INTO system_state (\`key\`, value)
     VALUES ('channel_week_menu', ?)`,
    [
      JSON.stringify({
        week: weekStartDate,
        messageId: messageId != null ? Number(messageId) : null,
        fingerprint: fingerprint || null,
        selfCount: Number(selfCount) || 0,
      }),
    ],
  );
}

export async function getAdminAccessToken(pool) {
  const [rows] = await pool.query(`SELECT value FROM system_state WHERE \`key\`='samad_accessToken'`);
  return rows[0]?.value || null;
}

export async function setAdminAccessToken(pool, accessToken) {
  await pool.query(
    `REPLACE INTO system_state (\`key\`, value)
     VALUES ('samad_accessToken', ?)`,
    [accessToken]
  );
}

export async function logoutUser(pool, telegramId) {
  await pool.query(
    `
    UPDATE users SET
      username = NULL,
      password = NULL,
      access_token = NULL,
      refresh_token = NULL,
      expires_at = NULL,
      last_checked_program = NULL,
      reserved_days = NULL,
      auto_reserve = 1
    WHERE id = ?
    `,
    [telegramId]
  );
}

export async function setUserLastCheckedProgram(userId, weekDate, pool) {
  await pool.query(
    `
    UPDATE users
    SET last_checked_program = ?,
        reserved_days = ?
    WHERE id = ?
    `,
    [weekDate, JSON.stringify({ week: weekDate, days: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"], attempts: {} }), userId]
  );
}

export async function touchReservedDay(userId, weekStartDate, dayEnglish, pool, { bump = false, done = false } = {}) {
  if (!userId || !weekStartDate || !dayEnglish) return { attempt: 1, state: null };

  const [rows] = await pool.query(`SELECT reserved_days, last_checked_program FROM users WHERE id = ?`, [userId]);
  const row = rows[0];
  if (!row) return { attempt: 1, state: null };
  if (sameWeekKey(row.last_checked_program, weekStartDate)) {
    const state = { week: weekStartDate, days: ["Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"], attempts: {} };
    return { attempt: 1, state };
  }

  const state = readReservedDaysState(row.reserved_days, weekStartDate);
  if (bump) state.attempts[dayEnglish] = (Number(state.attempts[dayEnglish]) || 0) + 1;
  if (done && !state.days.includes(dayEnglish)) state.days.push(dayEnglish);

  await pool.query(`UPDATE users SET reserved_days = ? WHERE id = ?`, [JSON.stringify(state), userId]);
  return { attempt: Number(state.attempts[dayEnglish]) || 1, state };
}
