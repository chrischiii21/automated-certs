import 'server-only';
import { db } from './db';

const WINDOW_MINUTES = 15;
const MAX_PER_EMAIL = 5;
const MAX_PER_IP = 20;

const since = `strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-${WINDOW_MINUTES} minutes')`;

/**
 * How many minutes until this email (or this IP address) may try a password
 * again; 0 when not locked. Locks after 5 failures for one email, or 20 from
 * one IP, within 15 minutes, and lifts 15 minutes after the triggering failure.
 */
export async function loginLockMinutes(email: string, ip: string | null): Promise<number> {
  const client = await db();
  const lockedUntil = async (column: 'email' | 'ip', value: string, max: number) => {
    // The max-th most recent failure in the window starts the lock.
    const { rows } = await client.execute({
      sql: `SELECT created_at FROM login_failures WHERE ${column} = ? AND created_at > ${since}
        ORDER BY created_at DESC LIMIT 1 OFFSET ?`,
      args: [value, max - 1],
    });
    return rows[0] ? new Date(String(rows[0].created_at)).getTime() + WINDOW_MINUTES * 60_000 : 0;
  };

  const until = Math.max(await lockedUntil('email', email, MAX_PER_EMAIL), ip ? await lockedUntil('ip', ip, MAX_PER_IP) : 0);
  return until > Date.now() ? Math.ceil((until - Date.now()) / 60_000) : 0;
}

export async function recordLoginFailure(email: string, ip: string | null) {
  await (await db()).batch(
    [
      { sql: 'INSERT INTO login_failures (email, ip) VALUES (?, ?)', args: [email, ip] },
      // Keep the table small: nothing older than a day matters.
      { sql: `DELETE FROM login_failures WHERE created_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 day')`, args: [] },
    ],
    'write',
  );
}

export async function clearLoginFailures(email: string) {
  await (await db()).execute({ sql: 'DELETE FROM login_failures WHERE email = ?', args: [email] });
}
