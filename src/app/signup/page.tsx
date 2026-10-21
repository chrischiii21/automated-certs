import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getViewer } from '@/lib/auth';
import { safeNext } from '@/lib/next-param';
import { AuthShell } from '@/components/auth/AuthShell';
import { SignupForm } from '@/components/auth/AuthForms';

export const metadata = { title: 'Create your account', alternates: { canonical: '/signup' } };

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const next = safeNext((await searchParams).next);
  const viewer = await getViewer();
  if (viewer?.kind === 'user') redirect(next);

  return (
    <AuthShell
      title="Create your free account"
      subtitle={viewer?.kind === 'guest' ? 'Your guest work will be saved to your new account.' : 'Share claim links, bulk-create certificates and keep your events.'}
      footer={
        <>
          <p>Already have an account? <Link href={`/login?next=${encodeURIComponent(next)}`} className="font-semibold text-accent hover:underline">Log in</Link></p>
          <p><Link href="/admin" className="hover:text-ink hover:underline">Continue as guest</Link></p>
        </>
      }
    >
      <SignupForm next={next} />
    </AuthShell>
  );
}
