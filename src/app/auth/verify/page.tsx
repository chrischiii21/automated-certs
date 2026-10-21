import Link from 'next/link';
import { MailCheck, TriangleAlert } from 'lucide-react';
import { peekEmailToken } from '@/lib/accounts';
import { safeNext } from '@/lib/next-param';
import { confirmVerifyAction } from '@/app/login/actions';
import { AuthShell } from '@/components/auth/AuthShell';

export const metadata = { title: 'Verify your email', robots: { index: false } };

/**
 * The verification link lands here. Verifying takes a button press rather than
 * happening on page load, so email scanners that pre-open links can't use up the
 * one-time token before the person does.
 */
export default async function VerifyPage({ searchParams }: { searchParams: Promise<{ token?: string; next?: string; expired?: string }> }) {
  const { token, next, expired } = await searchParams;
  const claim = token && !expired ? await peekEmailToken(token, 'verify') : null;

  if (!claim) {
    return (
      <AuthShell title="This link has expired" footer={<p><Link href="/login" className="hover:text-ink hover:underline">Back to log in</Link></p>}>
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning"><TriangleAlert className="h-6 w-6" /></span>
          <p className="mt-4 text-sm text-muted">
            Verification links work once and last 30 minutes. Log in with your email and password and we&apos;ll offer to send a new one.
          </p>
          <Link href="/login" className="btn-primary mt-5 h-11 w-full">Go to log in</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Verify your email">
      <div className="text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-accent"><MailCheck className="h-6 w-6" /></span>
        <p className="mt-4 text-sm text-muted">
          Confirm that <b className="text-ink">{claim.email}</b> is your email address to activate your account.
        </p>
        <form action={confirmVerifyAction} className="mt-5">
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="next" value={safeNext(next)} />
          <button className="btn-primary h-11 w-full">Verify my email</button>
        </form>
      </div>
    </AuthShell>
  );
}
