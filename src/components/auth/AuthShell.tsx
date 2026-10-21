import Link from 'next/link';
import { Award, Check } from 'lucide-react';
import { SITE } from '@/lib/site';

const PERKS = [
  'Share claim links so participants download their own certificate',
  'Bulk-create every certificate as a PDF or ZIP',
  'AI auto-style that matches the name to your design',
  'Unlimited events, saved to your account',
];

/** Two-panel layout shared by log in, sign up and password pages. */
export function AuthShell({ title, subtitle, children, footer }: {
  title: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-ink p-12 text-canvas lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-success/30 blur-3xl" />
        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-canvas text-ink"><Award className="h-5 w-5" /></span>
          <span className="font-display text-2xl font-semibold">{SITE.name}</span>
        </Link>
        <div className="relative">
          <h2 className="max-w-md font-display text-4xl font-semibold leading-tight">Certificates only your real participants can claim.</h2>
          <ul className="mt-8 space-y-3">
            {PERKS.map((p) => (
              <li key={p} className="flex gap-3 text-canvas/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-canvas/10"><Check className="h-3 w-3" /></span>
                {p}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-canvas/50">{SITE.name} by {SITE.owner} · Free to use</p>
      </section>

      <section className="flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center lg:text-left">
            <Link href="/" className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-ink text-canvas lg:hidden" aria-label={SITE.name}>
              <Award className="h-6 w-6" />
            </Link>
            <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <div className="card p-6">{children}</div>
          {footer && <div className="mt-6 space-y-2 text-center text-sm text-muted">{footer}</div>}
        </div>
      </section>
    </main>
  );
}
