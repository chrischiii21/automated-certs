import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getViewer } from '@/lib/auth';
import { safeNext } from '@/lib/next-param';
import { AuthShell } from '@/components/auth/AuthShell';
import { LoginForm } from '@/components/auth/AuthForms';

export const metadata = { title: 'Log in', alternates: { canonical: '/login' } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const viewer = await getViewer();
  if (viewer?.kind === 'user') redirect(next);

  return (
    <AuthShell
      title="Welcome back"
      subtitle={viewer?.kind === 'guest' ? 'Log in and your guest work will be saved to your account.' : 'Log in with your email and password.'}
      footer={
        <>
          <p>New to Certify? <Link href={`/signup?next=${encodeURIComponent(next)}`} className="font-semibold text-accent hover:underline">Create a free account</Link></p>
          <p><Link href="/admin" className="hover:text-ink hover:underline">Continue as guest</Link></p>
        </>
      }
    >
      <LoginForm next={next} />
    </AuthShell>
  );
}
