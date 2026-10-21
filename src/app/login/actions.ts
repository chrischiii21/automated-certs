'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  adoptEvents, consumeEmailToken, createEmailToken, discardEmailToken, getUserByEmail, getUserProfile,
  markEmailVerified, normalizeEmail, setPassword, upsertPendingUser, type TokenPurpose,
} from '@/lib/accounts';
import { getGuestId, startSession } from '@/lib/auth';
import { sendAuthEmail } from '@/lib/email';
import { hashPassword, passwordProblem, verifyPassword } from '@/lib/password';
import { clearLoginFailures, loginLockMinutes, recordLoginFailure } from '@/lib/throttle';

export type AuthState =
  | { status: 'idle' }
  | { status: 'sent'; email: string }
  | { status: 'unverified'; email: string }
  | { status: 'error'; message: string };

/** Only allow redirects back into this app. */
function safeNext(next: unknown): string {
  const n = typeof next === 'string' ? next : '';
  return n.startsWith('/') && !n.startsWith('//') ? n : '/admin';
}

async function appOrigin(): Promise<string> {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '');
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000';
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

/** Best-effort client IP (Vercel and most proxies set x-forwarded-for). */
async function clientIp(): Promise<string | null> {
  const h = await headers();
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || null;
}

const slowDown = () => new Promise((r) => setTimeout(r, 500));

/** Emails a verify or reset link. Returns an error message, or null when sent. */
async function emailLink(email: string, purpose: TokenPurpose, next: string): Promise<string | null> {
  const token = await createEmailToken(email, purpose, await getGuestId());
  if (!token) return 'An email was just sent to that address. Please wait a minute and try again.';
  const path = purpose === 'verify' ? '/auth/verify' : '/auth/reset';
  const link = `${await appOrigin()}${path}?token=${encodeURIComponent(token)}&next=${encodeURIComponent(next)}`;
  try {
    await sendAuthEmail(email, link, purpose);
    return null;
  } catch (err) {
    console.error(`Failed to send ${purpose} email`, err);
    await discardEmailToken(token);
    return "We couldn't send the email right now. Please try again in a moment.";
  }
}

/** Signs the user in, moves any guest work over, and sends them on (via the profile step if new). */
async function finishSignIn(userId: string, email: string, guestId: string | null, next: string): Promise<never> {
  await adoptEvents(userId, email, guestId);
  await startSession(userId, email);
  const profile = await getUserProfile(userId);
  redirect(profile?.onboarded ? next : `/onboarding?next=${encodeURIComponent(next)}`);
}

// ── Sign up ─────────────────────────────────────────────────────────

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  const password = String(formData.get('password') ?? '');
  const confirm = String(formData.get('confirm') ?? '');
  if (!email) return { status: 'error', message: 'Enter a valid email address.' };
  const problem = passwordProblem(password);
  if (problem) return { status: 'error', message: problem };
  if (password !== confirm) return { status: 'error', message: 'The passwords don’t match.' };

  const result = await upsertPendingUser(email, await hashPassword(password));
  if (result === 'exists') return { status: 'error', message: 'An account with this email already exists. Log in instead.' };

  const error = await emailLink(email, 'verify', safeNext(formData.get('next')));
  return error ? { status: 'error', message: error } : { status: 'sent', email };
}

/** Resends the verification email for an account that hasn't been verified yet. */
export async function resendVerificationAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  if (!email) return { status: 'error', message: 'Enter a valid email address.' };
  const user = await getUserByEmail(email);
  if (user && !user.verified) {
    const error = await emailLink(email, 'verify', safeNext(formData.get('next')));
    if (error) return { status: 'error', message: error };
  }
  return { status: 'sent', email };
}

/** The person clicked "Verify my email" on the link's page. */
export async function confirmVerifyAction(formData: FormData) {
  const claim = await consumeEmailToken(String(formData.get('token') ?? ''), 'verify');
  if (!claim) redirect('/auth/verify?expired=1');
  const userId = await markEmailVerified(claim.email);
  await finishSignIn(userId, claim.email, claim.guestId, safeNext(formData.get('next')));
}

// ── Log in ──────────────────────────────────────────────────────────

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  const password = String(formData.get('password') ?? '');
  if (!email) return { status: 'error', message: 'Incorrect email or password.' };

  // Checked before the password so a locked account gives nothing away, even to a correct guess.
  const ip = await clientIp();
  const lockedFor = await loginLockMinutes(email, ip);
  if (lockedFor) {
    return { status: 'error', message: `Too many attempts. Try again in ${lockedFor} minute${lockedFor === 1 ? '' : 's'}, or reset your password.` };
  }

  const user = await getUserByEmail(email);
  if (user && !user.passwordHash) {
    // Accounts made before passwords existed.
    return { status: 'error', message: 'This account doesn’t have a password yet. Use “Forgot password?” to set one.' };
  }
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    await recordLoginFailure(email, ip);
    await slowDown();
    return { status: 'error', message: 'Incorrect email or password.' };
  }
  if (!user.verified) return { status: 'unverified', email: user.email };

  await clearLoginFailures(email);
  return finishSignIn(user.id, user.email, await getGuestId(), safeNext(formData.get('next')));
}

// ── Forgot / reset password ─────────────────────────────────────────

export async function forgotPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = normalizeEmail(String(formData.get('email') ?? ''));
  if (!email) return { status: 'error', message: 'Enter a valid email address.' };
  // Same response whether or not the account exists, so this can't be used to discover accounts.
  if (await getUserByEmail(email)) {
    const error = await emailLink(email, 'reset', '/admin');
    if (error && !error.startsWith('An email was just sent')) return { status: 'error', message: error };
  } else {
    await slowDown();
  }
  return { status: 'sent', email };
}

export async function resetPasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const password = String(formData.get('password') ?? '');
  const problem = passwordProblem(password);
  if (problem) return { status: 'error', message: problem };
  if (password !== String(formData.get('confirm') ?? '')) return { status: 'error', message: 'The passwords don’t match.' };

  const claim = await consumeEmailToken(String(formData.get('token') ?? ''), 'reset');
  if (!claim) return { status: 'error', message: 'This reset link has expired. Request a new one.' };

  // Receiving the reset email also proves the address is theirs.
  const userId = await markEmailVerified(claim.email);
  await setPassword(userId, await hashPassword(password));
  await clearLoginFailures(claim.email);
  return finishSignIn(userId, claim.email, claim.guestId, safeNext(formData.get('next')));
}
