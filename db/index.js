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
