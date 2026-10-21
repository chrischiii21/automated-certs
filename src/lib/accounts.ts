import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { db } from './db';

const TOKEN_TTL_MINUTES = 30;
const NOW = `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`;

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export function normalizeEmail(email: string): string | null {
  const e = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) && e.length <= 254 ? e : null;
}

// ── Emailed links (verify a new account / reset a password) ────────

export type TokenPurpose = 'verify' | 'reset';

/**
 * Creates a single-use emailed token. Returns null when too many links were
 * requested recently (1 per minute, 5 per hour per address).
 */
export async function createEmailToken(email: string, purpose: TokenPurpose, guestId: string | null): Promise<string | null> {
  const client = await db();
  const { rows } = await client.execute({
    sql: `SELECT
        SUM(created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 minute')) AS last_minute,
        COUNT(*) AS last_hour
      FROM login_tokens WHERE email = ? AND created_at > strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '-1 hour')`,
    args: [email],
  });
  if (Number(rows[0]?.last_minute ?? 0) >= 1 || Number(rows[0]?.last_hour ?? 0) >= 5) return null;

  const token = randomBytes(32).toString('base64url');
  await client.execute({
    sql: `INSERT INTO login_tokens (token_hash, email, guest_id, purpose, expires_at)
      VALUES (?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ', 'now', '+${TOKEN_TTL_MINUTES} minutes'))`,
    args: [hashToken(token), email, guestId, purpose],
  });
  return token;
}

/** Looks up a token without using it up (for the confirmation pages). */
export async function peekEmailToken(token: string, purpose: TokenPurpose): Promise<{ email: string } | null> {
  const { rows } = await (await db()).execute({
    sql: `SELECT email FROM login_tokens WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ${NOW}`,
    args: [hashToken(token), purpose],
  });
  return rows[0] ? { email: String(rows[0].email) } : null;
}

/** Marks the token used and returns who it was for. Null if invalid, expired or already used. */
export async function consumeEmailToken(token: string, purpose: TokenPurpose): Promise<{ email: string; guestId: string | null } | null> {
  const { rows } = await (await db()).execute({
    sql: `UPDATE login_tokens SET used_at = ${NOW}
      WHERE token_hash = ? AND purpose = ? AND used_at IS NULL AND expires_at > ${NOW}
      RETURNING email, guest_id`,
    args: [hashToken(token), purpose],
  });
  if (!rows[0]) return null;
  return { email: String(rows[0].email), guestId: rows[0].guest_id == null ? null : String(rows[0].guest_id) };
}

/** Removes a token whose email failed to send, so it doesn't count toward the rate limit. */
export async function discardEmailToken(token: string) {
  await (await db()).execute({ sql: 'DELETE FROM login_tokens WHERE token_hash = ?', args: [hashToken(token)] });
}

// ── Accounts ────────────────────────────────────────────────────────

export interface UserCredentials {
  id: string;
  email: string;
  passwordHash: string | null;
  verified: boolean;
}

export async function getUserByEmail(email: string): Promise<UserCredentials | null> {
  const { rows } = await (await db()).execute({ sql: 'SELECT id, email, password_hash, email_verified_at FROM users WHERE email = ?', args: [email] });
  const r = rows[0];
  if (!r) return null;
  return { id: String(r.id), email: String(r.email), passwordHash: r.password_hash == null ? null : String(r.password_hash), verified: r.email_verified_at != null };
}

/**
 * Creates an unverified account, or updates the password of one that was
 * never verified (someone retrying sign-up). Verified accounts are untouched.
 */
export async function upsertPendingUser(email: string, passwordHash: string): Promise<'pending' | 'exists'> {
  const existing = await getUserByEmail(email);
  if (existing?.verified) return 'exists';
  const client = await db();
  if (existing) {
    await client.execute({ sql: 'UPDATE users SET password_hash = ? WHERE id = ?', args: [passwordHash, existing.id] });
  } else {
    await client.execute({
      sql: 'INSERT INTO users (id, email, password_hash) VALUES (?, ?, ?) ON CONFLICT (email) DO NOTHING',
      args: [crypto.randomUUID(), email, passwordHash],
    });
  }
  return 'pending';
}

/** Marks the email verified (creating the user if needed) and returns the user id. */
export async function markEmailVerified(email: string): Promise<string> {
  const client = await db();
  await client.execute({ sql: 'INSERT INTO users (id, email) VALUES (?, ?) ON CONFLICT (email) DO NOTHING', args: [crypto.randomUUID(), email] });
  const { rows } = await client.execute({
    sql: `UPDATE users SET email_verified_at = COALESCE(email_verified_at, ${NOW}) WHERE email = ? RETURNING id`,
    args: [email],
  });
  return String(rows[0].id);
}

export async function setPassword(userId: string, passwordHash: string) {
  await (await db()).execute({ sql: 'UPDATE users SET password_hash = ? WHERE id = ?', args: [passwordHash, userId] });
}

/**
 * Moves a guest's events into the account. The ADMIN_EMAIL account also adopts
 * events created before accounts existed.
 */
export async function adoptEvents(userId: string, email: string, guestId: string | null) {
  const client = await db();
  if (guestId) {
    await client.execute({ sql: 'UPDATE events SET owner_id = ? WHERE owner_id = ?', args: [userId, `guest:${guestId}`] });
  }
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && adminEmail === email) {
    await client.execute({ sql: 'UPDATE events SET owner_id = ? WHERE owner_id IS NULL', args: [userId] });
  }
}

// ── Profile ─────────────────────────────────────────────────────────

export type AccountType = 'individual' | 'organization';

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  accountType: AccountType | null;
  organization: string | null;
  useCase: string | null;
  onboarded: boolean;
}

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const { rows } = await (await db()).execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [userId] });
  const r = rows[0];
  if (!r) return null;
  const str = (v: unknown) => (v == null ? null : String(v));
  return {
    id: String(r.id),
    email: String(r.email),
    name: str(r.name),
    accountType: str(r.account_type) as AccountType | null,
    organization: str(r.organization),
    useCase: str(r.use_case),
    onboarded: r.onboarded_at != null,
  };
}

export async function saveUserProfile(
  userId: string,
  profile: { name: string; accountType: AccountType; organization: string | null; useCase: string | null },
) {
  await (await db()).execute({
    sql: `UPDATE users SET name = ?, account_type = ?, organization = ?, use_case = ?,
      onboarded_at = COALESCE(onboarded_at, ${NOW}) WHERE id = ?`,
    args: [profile.name, profile.accountType, profile.organization, profile.useCase, userId],
  });
}
