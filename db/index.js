import { encrypt } from "../utils/cypto.js";

export async function getUser(id, pool) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
}
export async function saveSession(pool, telegramId, username, password, session) {
  username = encrypt(username);
  password = encrypt(password);
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
export async function getSession(pool, telegramId) {
  const [rows] = await pool.query(`SELECT * FROM users WHERE id = ?`, [telegramId]);
  return rows[0] || null;
}

export async function savefoodPriority(pool, userId, food_priority) {
  await pool.query("UPDATE users SET food_priority = ? WHERE id = ?", [JSON.stringify(food_priority), userId]);
}
export async function saveDays(pool, userId, days) {
  await pool.query("UPDATE users SET days = ? WHERE id = ?", [JSON.stringify(days), userId]);
}

export async function getLoggedInUsers(pool) {
  const [rows] = await pool.query(`
SELECT id, username, password, access_token, auto_reserve, food_priority, days
FROM users
WHERE username IS NOT NULL
  AND username <> ''
`);
  return rows;
}

export async function getAutoReserveUsers(pool) {
  const [rows] = await pool.query(`
SELECT users.*
FROM users
JOIN system_state
  ON system_state.\`key\` = 'last_reserved_week'
WHERE users.auto_reserve = 1

  AND users.username IS NOT NULL
  AND users.username <> ''
  AND users.food_priority IS NOT NULL
  AND users.food_priority <> ''

  AND (
    users.last_checked_program IS NULL
    OR users.last_checked_program <> DATE(system_state.value)
  );
  `);

  return rows.map((u) => ({
    id: u.id,
    username: u.username,
    password: u.password,
    access_token: u.access_token,
    created_at: u.created_at,
    food_priority: typeof u.food_priority === "string" ? JSON.parse(u.food_priority || "[]") : u.food_priority || [],
    days: typeof u.days === "string" ? JSON.parse(u.days || "[]") : u.days || [],
    force_reserve: Number(u.force_reserve) === 1,
    wait_selves: (() => {
      try {
        const v = typeof u.wait_selves === "string" ? JSON.parse(u.wait_selves || "[1]") : u.wait_selves;
        return Array.isArray(v) && v.length ? v.map(Number) : [1];
      } catch {
        return [1];
      }
    })(),
  }));
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

function sameWeekKey(a, b) {
  if (!a || !b) return false;
  return String(a).slice(0, 10) === String(b).slice(0, 10);
}

export async function getChannelNotifyState(pool, weekStartDate) {
  const [rows] = await pool.query(`SELECT value FROM system_state WHERE \`key\`='channel_notified_selves'`);
  const raw = rows[0]?.value;
  const empty = { summarySent: false, ids: [], dayCounts: {} };
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
    return { summarySent: !!parsed?.summarySent, ids, dayCounts };
  } catch {
    return empty;
  }
}

export async function setChannelNotifyState(pool, weekStartDate, { summarySent = false, ids = [], dayCounts = {} } = {}) {
  const unique = [...new Set((ids || []).map(Number).filter((n) => Number.isFinite(n)))];
  const counts = {};
  for (const [k, v] of Object.entries(dayCounts || {})) {
    const id = Number(k);
    const n = Number(v);
    if (Number.isFinite(id) && Number.isFinite(n) && n > 0) counts[id] = n;
  }
  await pool.query(
    `REPLACE INTO system_state (\`key\`, value)
     VALUES ('channel_notified_selves', ?)`,
    [JSON.stringify({ week: weekStartDate, summarySent: !!summarySent, ids: unique, dayCounts: counts })],
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
      last_error_at = NULL,
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
    SET last_checked_program = ?
    WHERE id = ?
    `,
    [weekDate, userId]
  );
}

export async function markReserveError(userId, pool) {
  await pool.query(
    `
    UPDATE users
    SET last_error_at = NOW()
    WHERE id = ?
    `,
    [userId]
  );
}

export async function clearReserveError(userId, pool) {
  await pool.query(
    `
    UPDATE users
    SET last_error_at = NULL
    WHERE id = ?
    `,
    [userId]
  );
}
