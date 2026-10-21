import type { Metadata } from 'next';
import { Award, Bookmark, Clock, Link2, Lock, Mail, MessageCircle, SearchX, type LucideIcon } from 'lucide-react';
import { cache } from 'react';
import { getEvent as fetchEvent } from '@/lib/data';
import { SITE } from '@/lib/site';
import type { PublicEvent } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ClaimFlow } from './ClaimFlow';

type Props = { params: Promise<{ id: string }> };

const getEvent = cache(fetchEvent);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const event = await getEvent((await params).id);
  // Claim pages are shared privately with participants; keep them out of search results.
  return { title: event ? `Claim your certificate · ${event.name}` : 'Certificate not found', robots: { index: false, follow: false } };
}

export default async function ClaimPage({ params }: Props) {
  const event = await getEvent((await params).id);
  const organizer = event?.organizer ?? null;

  if (!event) {
    return (
      <Notice
        tone="neutral"
        icon={SearchX}
        badge="Link not found"
        title="We couldn't find this certificate"
        body="This link doesn't match any event. It may have been mistyped, or the event was removed."
        steps={[
          { icon: Link2, title: 'Check the link', body: 'Make sure you opened the full link exactly as it was sent.' },
          { icon: MessageCircle, title: 'Ask the organizer', body: 'They can send you the correct claim link.' },
        ]}
      />
    );
  }
  if (event.status === 'draft') {
    return (
      <Notice
        event={event}
        tone="accent"
        icon={Clock}
        badge="Opening soon"
        title="Certificates aren't available yet"
        body={`${organizer ?? 'The organizer'} hasn't opened claiming for this event yet.`}
        steps={[
          { icon: Bookmark, title: 'Bookmark this page', body: 'This same link will work as soon as claiming opens.' },
          { icon: Mail, title: 'Watch for an announcement', body: `${organizer ?? 'The organizer'} will let participants know when certificates are ready.` },
        ]}
      />
    );
  }
  if (event.status === 'closed') {
    return (
      <Notice
        event={event}
        tone="warning"
        icon={Lock}
        badge="Claiming closed"
        title="The claim period has ended"
        body="Certificates for this event can no longer be downloaded here."
        steps={[
          { icon: MessageCircle, title: `Contact ${organizer ?? 'the organizer'}`, body: 'If you attended and still need your certificate, they can send it to you directly.' },
          { icon: Mail, title: 'Check your email', body: 'Some organizers send certificates to participants after claiming closes.' },
        ]}
      />
    );
  }

  // Only the fields needed to render. The participant list stays on the server.
  const publicEvent: PublicEvent = {
    id: event.id,
    name: event.name,
    templateUrl: event.templateUrl,
    logoUrl: event.logoUrl,
    organizer: event.organizer,
    layout: event.layout,
    status: event.status,
  };
  return <ClaimFlow event={publicEvent} />;
}

const TONES = {
  accent: 'bg-accent-soft text-accent',
  warning: 'bg-warning-soft text-warning',
  neutral: 'bg-sunken text-muted',
} as const;

/** Status page for a claim link that can't be used right now. Mirrors the dashboard's workspace layout. */
function Notice({ event, tone, icon: Icon, badge, title, body, steps }: {
  event?: Pick<PublicEvent, 'name' | 'templateUrl' | 'logoUrl' | 'organizer'>;
  tone: keyof typeof TONES;
  icon: LucideIcon;
  badge: string;
  title: string;
  body: string;
  steps: { icon: LucideIcon; title: string; body: string }[];
}) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        {/* Event identity */}
        <header className="flex items-center gap-4">
          {event?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.logoUrl} alt={event.organizer ?? 'Organizer logo'} className="h-14 w-14 shrink-0 rounded-2xl bg-surface object-contain p-1.5 shadow-card" />
          ) : (
            <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-card', event ? 'bg-surface text-accent' : TONES[tone])}>
              {event ? <Award className="h-7 w-7" /> : <Icon className="h-7 w-7" />}
            </span>
          )}
          <div className="min-w-0">
            <p className="text-sm text-muted">{event ? (event.organizer ?? 'Official certificate') : 'Certify'}</p>
            <h1 className="font-display text-3xl font-semibold leading-tight tracking-tight text-balance sm:text-4xl">
              {event ? event.name : title}
            </h1>
          </div>
        </header>

        <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left: the certificate itself (or a placeholder when the link is wrong) */}
          <section className="card relative flex min-h-72 items-center justify-center overflow-hidden p-5 sm:p-8 lg:col-span-7">
            <span className={cn('absolute left-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-card', TONES[tone])}>
              <Icon className="h-3.5 w-3.5" />
              {badge}
            </span>
            {event ? (
              <div className="relative mt-6 w-full overflow-hidden rounded-lg shadow-card">
                {/* Heavily blurred: signatures and other details on the design shouldn't be readable here. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={event.templateUrl} alt="" aria-hidden className="w-full scale-110 opacity-80 blur-xl saturate-125" />
                <div className="absolute inset-0 bg-surface/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={cn('flex h-16 w-16 items-center justify-center rounded-2xl bg-surface shadow-pop', tone === 'warning' ? 'text-warning' : 'text-accent')}>
                    <Icon className="h-7 w-7" />
                  </span>
                </div>
              </div>
            ) : (
              <span className="flex aspect-[1.414/1] w-56 items-center justify-center rounded-lg border-2 border-dashed border-line-strong bg-sunken/60">
                <Icon className="h-9 w-9 text-faint" />
              </span>
            )}
          </section>

          {/* Right: what happened and what to do next */}
          <section className="card p-6 lg:col-span-5">
            <span className={cn('flex h-10 w-10 items-center justify-center rounded-xl', TONES[tone])}>
              <Icon className="h-5 w-5" />
            </span>
            <h2 className="mt-4 text-lg font-bold">{event ? title : 'What happened?'}</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted">{body}</p>

            <h3 className="mt-6 text-sm font-bold">What you can do</h3>
            <ol className="mt-4 space-y-4">
              {steps.map((s, i) => (
                <li key={s.title} className="flex gap-4">
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                    <s.icon className="h-5 w-5" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-canvas">{i + 1}</span>
                  </span>
                  <div>
                    <p className="font-semibold">{s.title}</p>
                    <p className="mt-0.5 text-sm text-muted">{s.body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <p className="mt-8 flex items-center justify-center gap-1.5 text-xs text-faint">
          <Award className="h-3.5 w-3.5" /> Certificates issued with {SITE.name} by {SITE.owner}
        </p>
      </div>
    </main>
  );
}
