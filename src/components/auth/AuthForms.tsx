"use client";

import { useActionState, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Eye, EyeOff, Loader2, MailCheck } from 'lucide-react';
import {
  forgotPasswordAction, loginAction, resendVerificationAction, resetPasswordAction, signUpAction, type AuthState,
} from '@/app/login/actions';

const IDLE: AuthState = { status: 'idle' };

function PasswordInput({ id, name, label, autoComplete, hint }: { id: string; name: string; label: React.ReactNode; autoComplete: string; hint?: string }) {
  const [shown, setShown] = useState(false);
  return (
    <div>
      <label htmlFor={id} className="label">{label}</label>
      <div className="relative">
        <input id={id} name={name} type={shown ? 'text' : 'password'} className="input h-11 pr-11" autoComplete={autoComplete} required />
        <button
          type="button"
          onClick={() => setShown((s) => !s)}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-faint hover:bg-sunken hover:text-ink"
          aria-label={shown ? 'Hide password' : 'Show password'}
        >
          {shown ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-faint">{hint}</p>}
    </div>
  );
}

/** Keeps the typed email after a failed submit (React resets uncontrolled form fields). */
function EmailInput() {
  const [email, setEmail] = useState('');
  return (
    <input
      id="email"
      name="email"
      type="email"
      className="input h-11"
      placeholder="you@gmail.com"
      autoComplete="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      autoFocus
      required
    />
  );
}

function Submit({ pending, children }: { pending: boolean; children: React.ReactNode }) {
  return (
    <button className="btn-primary h-11 w-full" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
      {!pending && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

function ErrorText({ state }: { state: AuthState }) {
  return state.status === 'error' ? <p className="text-sm font-medium text-danger">{state.message}</p> : null;
}

function CheckInbox({ email, title, body, resend }: { email: string; title: string; body: React.ReactNode; resend?: React.ReactNode }) {
  return (
    <div className="text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success-soft text-success">
        <MailCheck className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-lg font-bold">{title}</h2>
      <p className="mt-1.5 text-sm text-muted">
        We sent an email to <b className="text-ink">{email}</b>. {body}
      </p>
      <p className="mt-4 text-xs text-faint">Not there? Check Spam or Promotions. Links expire after 30 minutes.</p>
      {resend}
    </div>
  );
}

/** Small form that re-sends the verification email for an unverified account. */
function ResendVerification({ email, next }: { email: string; next: string }) {
  const [state, action, pending] = useActionState(resendVerificationAction, IDLE);
  return (
    <form action={action} className="mt-3">
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="next" value={next} />
      <button className="btn-ghost btn-sm" disabled={pending}>
        {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {state.status === 'sent' ? 'Sent again ✓' : 'Resend verification email'}
      </button>
      {state.status === 'error' && <p className="mt-1 text-xs text-danger">{state.message}</p>}
    </form>
  );
}

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(loginAction, IDLE);

  if (state.status === 'unverified') {
    return (
      <CheckInbox
        email={state.email}
        title="Verify your email first"
        body="Open the verification link we sent when you signed up, then log in."
        resend={<ResendVerification email={state.email} next={next} />}
      />
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <EmailInput />
      </div>
      <PasswordInput
        id="password"
        name="password"
        autoComplete="current-password"
        label={
          <span className="flex items-center justify-between">
            Password
            <Link href="/forgot-password" className="font-semibold text-accent hover:underline">Forgot password?</Link>
          </span>
        }
      />
      <ErrorText state={state} />
      <Submit pending={pending}>Log in</Submit>
    </form>
  );
}

export function SignupForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState(signUpAction, IDLE);

  if (state.status === 'sent') {
    return (
      <CheckInbox
        email={state.email}
        title="Verify your email"
        body="Click the link inside to activate your account. After that you'll log in with your email and password."
        resend={<ResendVerification email={state.email} next={next} />}
      />
    );
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="label">Email</label>
        <EmailInput />
      </div>
      <PasswordInput id="password" name="password" label="Password" autoComplete="new-password" hint="At least 8 characters, with letters and numbers." />
      <PasswordInput id="confirm" name="confirm" label="Confirm password" autoComplete="new-password" />
      <ErrorText state={state} />
      <Submit pending={pending}>Create account</Submit>
      <p className="text-center text-xs text-faint">We&apos;ll email you a link to verify it&apos;s really you.</p>
    </form>
  );
}

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, IDLE);

  if (state.status === 'sent') {
    return (
      <CheckInbox
        email={state.email}
        title="Check your inbox"
        body="If there's an account for this address, the email has a link to choose a new password."
      />
    );
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <EmailInput />
      </div>
      <ErrorText state={state} />
      <Submit pending={pending}>Email me a reset link</Submit>
    </form>
  );
}

export function ResetPasswordForm({ token, next }: { token: string; next: string }) {
  const [state, action, pending] = useActionState(resetPasswordAction, IDLE);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="next" value={next} />
      <PasswordInput id="password" name="password" label="New password" autoComplete="new-password" hint="At least 8 characters, with letters and numbers." />
      <PasswordInput id="confirm" name="confirm" label="Confirm new password" autoComplete="new-password" />
      <ErrorText state={state} />
      <Submit pending={pending}>Save password and log in</Submit>
    </form>
  );
}
