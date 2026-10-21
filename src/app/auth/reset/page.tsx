import Link from 'next/link';
import { TriangleAlert } from 'lucide-react';
import { peekEmailToken } from '@/lib/accounts';
import { safeNext } from '@/lib/next-param';
import { AuthShell } from '@/components/auth/AuthShell';
import { ResetPasswordForm } from '@/components/auth/AuthForms';

export const metadata = { title: 'Choose a new password', robots: { index: false } };

export default async function ResetPage({ searchParams }: { searchParams: Promise<{ token?: string; next?: string }> }) {
  const { token, next } = await searchParams;
  const claim = token ? await peekEmailToken(token, 'reset') : null;

  if (!claim || !token) {
    return (
      <AuthShell title="Link expired" footer={<p><Link href="/login" className="hover:text-ink hover:underline">Back to log in</Link></p>}>
        <div className="text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning-soft text-warning"><TriangleAlert className="h-6 w-6" /></span>
          <p className="mt-4 text-sm text-muted">Password reset links work once and last 30 minutes.</p>
          <Link href="/forgot-password" className="btn-primary mt-5 h-11 w-full">Send a new link</Link>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Choose a new password" subtitle={<>For <b className="text-ink">{claim.email}</b></>}>
      <ResetPasswordForm token={token} next={safeNext(next)} />
    </AuthShell>
  );
}
