import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Award, Check } from 'lucide-react';
import { getUserProfile } from '@/lib/accounts';
import { requireUserPage } from '@/lib/auth';
import { ProfileForm } from './ProfileForm';

export const metadata = { title: 'Set up your profile', robots: { index: false } };

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ next?: string; edit?: string }> }) {
  const { next: rawNext, edit } = await searchParams;
  const next = rawNext?.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/admin';
  const user = await requireUserPage(`/onboarding?next=${encodeURIComponent(next)}`);
  const profile = await getUserProfile(user.userId);
  if (!profile) redirect('/login');
  // Already set up: only show the form when explicitly editing.
  if (profile.onboarded && !edit) redirect(next);
  const isNew = !profile.onboarded;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <Link href="/admin" className="inline-flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-canvas"><Award className="h-4.5 w-4.5" /></span>
          <span className="font-display text-xl font-semibold tracking-tight">Certify</span>
        </Link>

        <div className="mt-10">
          <p className="text-sm text-muted">{isNew ? 'Email verified' : 'Account'}</p>
          <h1 className="mt-0.5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {isNew ? 'Set up your profile' : 'Edit your profile'}
          </h1>
          <p className="mt-1.5 text-muted">Signed in as {profile.email}</p>
        </div>

        <div className="mt-8 grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
          <section className="card p-6 sm:p-8 lg:col-span-7">
            <ProfileForm profile={profile} next={next} isNew={isNew} />
          </section>

          <aside className="card p-6 lg:col-span-5">
            <h2 className="text-sm font-bold">{isNew ? 'You’re almost there' : 'How we use this'}</h2>
            <ul className="mt-5 space-y-4 text-sm">
              {[
                ['Personal dashboard', 'We greet you by name and keep your events together.'],
                ['Faster event setup', 'Your organization name pre-fills “Organized by” on new events.'],
                ['Private by default', 'Your details are never shown to participants unless you add them to an event.'],
              ].map(([title, body]) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-success-soft text-success"><Check className="h-3.5 w-3.5" /></span>
                  <div>
                    <p className="font-semibold">{title}</p>
                    <p className="mt-0.5 text-muted">{body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
