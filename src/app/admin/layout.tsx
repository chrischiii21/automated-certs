import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Award, LogOut, Sparkles } from 'lucide-react';
import { redirect } from 'next/navigation';
import { getUserProfile } from '@/lib/accounts';
import { getViewer } from '@/lib/auth';
import { SITE } from '@/lib/site';
import { WelcomeToast } from '@/components/admin/WelcomeToast';
import { logoutAction } from './actions';

export const metadata: Metadata = { title: 'Dashboard', robots: { index: false, follow: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await getViewer();
  const profile = viewer?.kind === 'user' ? await getUserProfile(viewer.userId) : null;
  if (viewer?.kind === 'user' && !profile?.onboarded) redirect('/onboarding?next=/admin');

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-canvas/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-canvas">
              <Award className="h-4.5 w-4.5" />
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">Certify</span>
          </Link>
          {viewer?.kind === 'user' ? (
            <div className="flex items-center gap-2">
              <Link href="/onboarding?edit=1" className="flex items-center gap-2.5 rounded-xl px-2 py-1 hover:bg-sunken" title="Edit profile">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-xs font-bold uppercase text-accent">
                  {(profile?.name ?? viewer.email)[0]}
                </span>
                <span className="hidden text-left leading-tight sm:block">
                  <span className="block text-sm font-semibold">{profile?.name ?? viewer.email}</span>
                  <span className="block text-xs text-muted">{profile?.organization ?? viewer.email}</span>
                </span>
              </Link>
              <form action={logoutAction}>
                <button className="btn-ghost btn-sm">
                  <LogOut className="h-4 w-4" />
                  Log out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login" className="btn-ghost btn-sm">Log in</Link>
              <Link href="/signup" className="btn-primary btn-sm">Sign up free</Link>
            </div>
          )}
        </div>
      </header>

      {viewer?.kind !== 'user' && (
        <div className="border-b bg-accent-soft/70">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm sm:px-6">
            <Sparkles className="h-4 w-4 shrink-0 text-accent" />
            <span className="text-ink">
              <b>You&apos;re trying Certify as a guest.</b>{' '}
              <span className="text-muted">Sign up free to share claim links, bulk-create certificates and keep your work.</span>
            </span>
          </div>
        </div>
      )}

      <Suspense><WelcomeToast /></Suspense>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      <footer className="mx-auto max-w-6xl px-4 pb-8 pt-4 text-xs text-faint sm:px-6">
        © {new Date().getFullYear()} {SITE.name} by {SITE.owner}
      </footer>
    </div>
  );
}
