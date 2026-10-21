import Link from 'next/link';
import { AuthShell } from '@/components/auth/AuthShell';
import { ForgotPasswordForm } from '@/components/auth/AuthForms';

export const metadata = { title: 'Reset your password', robots: { index: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a link to choose a new one."
      footer={<p><Link href="/login" className="font-semibold text-accent hover:underline">Back to log in</Link></p>}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
