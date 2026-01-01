export async function getUser(id, pool) {
  const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
  return rows[0];
}
export async function saveSession(pool, telegramId, username, password, session) {
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

export async function getAutoReserveUsers(pool) {
  const [rows] = await pool.query(`
    SELECT users.*
      FROM users
      JOIN system_state
        ON system_state.\`key\` = 'last_reserved_week'
      WHERE users.auto_reserve = 1
        AND (
          users.last_checked_program IS NULL
          OR users.last_checked_program <> DATE(system_state.value)
        )
        AND (
          users.last_error_at IS NULL
          OR users.last_error_at <= NOW() - INTERVAL 1 DAY
        );
  `);

  return rows.map((u) => ({
    id: u.id,
    access_token: u.access_token,
    food_priority: typeof u.food_priority === "string" ? JSON.parse(u.food_priority || "[]") : u.food_priority || [],
    days: typeof u.days === "string" ? JSON.parse(u.days || "[]") : u.days || [],
  }));
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
      auto_reserve = 0
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
