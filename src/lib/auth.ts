import 'server-only';
import { createHash, createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SESSION_COOKIE = 'certify_session';
const GUEST_COOKIE = 'certify_guest';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days
const GUEST_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

/** Who is using the dashboard: a signed-in organizer, or a guest trying it out. */
export type Viewer =
  | { kind: 'user'; userId: string; email: string; ownerId: string }
  | { kind: 'guest'; guestId: string; ownerId: string };

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === 'production') throw new Error('SESSION_SECRET is not set');
  return 'dev-only-insecure-secret';
}

function sign(value: string): string {
  return createHmac('sha256', secret()).update(value).digest('base64url');
}

function safeEqual(a: string, b: string): boolean {
  // Hash first so lengths always match and the comparison is constant-time.
  return timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());
}

/** Encodes a payload as `base64url(payload).signature` so it can't be forged or edited. */
function seal(payload: string): string {
  return `${Buffer.from(payload).toString('base64url')}.${sign(payload)}`;
}

function unseal(token: string | undefined): string | null {
  if (!token) return null;
  const [data, signature] = token.split('.');
  if (!data || !signature) return null;
  const payload = Buffer.from(data, 'base64url').toString();
  return safeEqual(signature, sign(payload)) ? payload : null;
}

const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge,
});

export async function getViewer(): Promise<Viewer | null> {
  const store = await cookies();
  const session = unseal(store.get(SESSION_COOKIE)?.value);
  if (session) {
    const { userId, email, exp } = JSON.parse(session) as { userId: string; email: string; exp: number };
    if (exp > Date.now()) return { kind: 'user', userId, email, ownerId: userId };
  }
  const guestId = unseal(store.get(GUEST_COOKIE)?.value);
  if (guestId) return { kind: 'guest', guestId, ownerId: `guest:${guestId}` };
  return null;
}

/**
 * For server actions and route handlers: returns the viewer, starting a guest
 * session for first-time visitors so they can try the app without an account.
 */
export async function ensureViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (viewer) return viewer;
  const guestId = randomUUID();
  (await cookies()).set(GUEST_COOKIE, seal(guestId), cookieOptions(GUEST_MAX_AGE));
  return { kind: 'guest', guestId, ownerId: `guest:${guestId}` };
}

/** For actions that need a signed-in account (not just a guest). */
export async function requireUser(): Promise<Extract<Viewer, { kind: 'user' }>> {
  const viewer = await getViewer();
  if (viewer?.kind !== 'user') throw new Error('SIGNUP_REQUIRED');
  return viewer;
}

export async function getGuestId(): Promise<string | null> {
  return unseal((await cookies()).get(GUEST_COOKIE)?.value);
}

export async function startSession(userId: string, email: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, seal(JSON.stringify({ userId, email, exp: Date.now() + SESSION_MAX_AGE * 1000 })), cookieOptions(SESSION_MAX_AGE));
  store.delete(GUEST_COOKIE);
}

export async function endSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

/** For pages that only make sense when signed in. */
export async function requireUserPage(next = '/admin') {
  const viewer = await getViewer();
  if (viewer?.kind !== 'user') redirect(`/login?next=${encodeURIComponent(next)}`);
  return viewer;
}
