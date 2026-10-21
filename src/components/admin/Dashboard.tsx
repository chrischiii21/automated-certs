"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Award, CircleCheck, ImageUp, ListChecks, Lock, Plus, Search, Send, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EventStatus, EventSummary } from '@/lib/types';
import { CopyLinkButton } from './CopyLinkButton';
import { NewEventButton } from './NewEventButton';
import { StatusBadge } from './StatusBadge';

type Filter = 'all' | EventStatus;

interface Props {
  events: EventSummary[];
  isGuest: boolean;
  canCreate: boolean;
  greetingName: string | null;
  defaultOrganizer: string | null;
}

export function Dashboard({ events, isGuest, canCreate, greetingName, defaultOrganizer }: Props) {
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const totals = useMemo(
    () =>
      events.reduce(
        (t, e) => ({ participants: t.participants + e.participantCount, claimed: t.claimed + e.claimedCount, open: t.open + (e.status === 'open' ? 1 : 0) }),
        { participants: 0, claimed: 0, open: 0 },
      ),
    [events],
  );
  const rate = totals.participants ? totals.claimed / totals.participants : 0;

  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: events.length, open: 0, draft: 0, closed: 0 };
    for (const e of events) c[e.status]++;
    return c;
  }, [events]);

  const visible = events.filter(
    (e) => (filter === 'all' || e.status === filter) && (!query.trim() || e.name.toLowerCase().includes(query.trim().toLowerCase())),
  );

  if (events.length === 0) return <EmptyState isGuest={isGuest} canCreate={canCreate} defaultOrganizer={defaultOrganizer} />;

  // Concrete next steps, so the sidebar tells organizers what to do rather than just what exists.
  const attention = events
    .flatMap((e) => {
      const href = `/admin/events/${e.id}`;
      if (e.participantCount === 0 && e.status !== 'closed') return [{ id: e.id, name: e.name, text: 'Add participants', href: `${href}?tab=participants`, tone: 'bg-warning' }];
      if (e.status === 'draft') return [{ id: e.id, name: e.name, text: isGuest ? 'Sign up to share it' : 'Ready to open claiming', href, tone: 'bg-accent' }];
      return [];
    })
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted">{greetingName ? `Welcome back, ${greetingName}` : 'Guest workspace'}</p>
          <h1 className="mt-0.5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your events</h1>
          <p className="mt-1.5 text-muted">
            {totals.open > 0
              ? `${totals.open} event${totals.open === 1 ? ' is' : 's are'} accepting claims right now.`
              : 'Only people on an event’s participant list can claim its certificate.'}
          </p>
        </div>
        <NewEventButton defaultOrganizer={defaultOrganizer} canCreate={canCreate} className="btn-primary shadow-pop">
          <Plus className="h-4 w-4" /> {canCreate ? 'New event' : 'Sign up to add more events'}
        </NewEventButton>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Left: events */}
        <section className="space-y-4 lg:col-span-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-1 overflow-x-auto rounded-xl bg-sunken p-1 [scrollbar-width:none]">
              {([
                ['all', 'All'],
                ['open', 'Open'],
                ['draft', 'Drafts'],
                ['closed', 'Closed'],
              ] as const).map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => setFilter(id)}
                  className={cn(
                    'flex h-8 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold transition-colors',
                    filter === id ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink',
                  )}
                >
                  {label}
                  <span className={cn('rounded-full px-1.5 text-[11px] tabular-nums', filter === id ? 'bg-accent-soft text-accent' : 'bg-line/60')}>{counts[id]}</span>
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-56">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input className="input h-9 pl-9" placeholder="Search events" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            {visible.map((event) => <EventCard key={event.id} event={event} />)}
            {filter === 'all' && !query && (
              <NewEventButton defaultOrganizer={defaultOrganizer}
                canCreate={canCreate}
                className="group card flex min-h-72 flex-col items-center justify-center gap-3 border-2 border-dashed border-line-strong p-6 text-center transition-colors hover:border-accent hover:bg-accent-soft/30"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-white shadow-pop transition-transform group-hover:scale-105">
                  <Plus className="h-6 w-6" />
                </span>
                <span className="font-bold">{canCreate ? 'Create a new event' : 'Want more events?'}</span>
                <span className="max-w-[14rem] text-sm text-muted">
                  {canCreate ? 'Upload a design and add your participant list.' : 'Guests can try one event. Sign up free for unlimited events.'}
                </span>
              </NewEventButton>
            )}
          </div>
          {visible.length === 0 && (
            <p className="py-10 text-center text-sm text-muted">No events match. Try a different filter or search.</p>
          )}
        </section>

        {/* Right: overview + next steps, styled like the guest workspace's "How it works" card */}
        <aside className="space-y-5 lg:sticky lg:top-24 lg:col-span-4">
          <section className="card p-6">
            <h2 className="text-sm font-bold">Overview</h2>
            <ul className="mt-5 space-y-4">
              <OverviewRow icon={Award} tone="bg-accent-soft text-accent" label="Events" value={events.length.toLocaleString()} />
              <OverviewRow icon={Send} tone="bg-success-soft text-success" label="Claiming open" value={totals.open.toLocaleString()} />
              <OverviewRow icon={Users} tone="bg-warning-soft text-warning" label="Participants" value={totals.participants.toLocaleString()} />
              <OverviewRow icon={CircleCheck} tone="bg-success-soft text-success" label="Certificates claimed" value={`${totals.claimed.toLocaleString()}`}>
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-success-soft">
                    <div className="h-full rounded-full bg-success" style={{ width: `${rate * 100}%` }} />
                  </div>
                  <span className="text-[11px] tabular-nums text-faint">{Math.round(rate * 100)}%</span>
                </div>
              </OverviewRow>
            </ul>
          </section>

          <section className="card p-6">
            <h2 className="text-sm font-bold">Needs attention</h2>
            {attention.length ? (
              <ul className="mt-4 space-y-1">
                {attention.map((a) => (
                  <li key={a.id}>
                    <Link href={a.href} className="-mx-2 flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-sunken">
                      <span className={cn('h-2 w-2 shrink-0 rounded-full', a.tone)} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{a.name}</span>
                        <span className="block text-xs text-muted">{a.text}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 shrink-0 text-faint" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-success-soft px-4 py-3 text-sm text-success">
                <CircleCheck className="h-4 w-4 shrink-0" /> All caught up. Every event is set up.
              </p>
            )}
            {isGuest && (
              <p className="mt-4 rounded-xl bg-sunken px-4 py-3 text-xs leading-relaxed text-muted">
                As a guest you can design an event and add participants. Sharing the claim link and bulk create need a free account.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function OverviewRow({ icon: Icon, tone, label, value, children }: {
  icon: typeof Award;
  tone: string;
  label: string;
  value: string;
  children?: React.ReactNode;
}) {
  return (
    <li className="flex gap-4">
      <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tone)}><Icon className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-sm text-muted">{label}</span>
          <span className="text-lg font-semibold">{value}</span>
        </div>
        {children}
      </div>
    </li>
  );
}

function EventCard({ event }: { event: EventSummary }) {
  const pct = event.participantCount ? (event.claimedCount / event.participantCount) * 100 : 0;
  const href = `/admin/events/${event.id}`;
  const nextStep =
    event.participantCount === 0
      ? { label: 'Add participants', href: `${href}?tab=participants` }
      : event.status === 'draft'
        ? { label: 'Ready to share', href }
        : null;

  return (
    <article className="card group relative flex flex-col overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pop">
      <Link href={href} className="relative block aspect-[1.6/1] overflow-hidden bg-sunken" aria-label={`Open ${event.name}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={event.templateUrl} alt="" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-transparent" />
        <StatusBadge status={event.status} className="absolute left-3 top-3 bg-surface/95 shadow-card backdrop-blur" />
      </Link>

      <div className="relative flex flex-1 flex-col p-4 pt-3">
        {event.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.logoUrl} alt="" className="absolute -top-7 right-4 h-12 w-12 rounded-xl bg-surface object-contain p-1 shadow-pop ring-2 ring-surface" />
        )}
        {event.organizer && <p className="truncate pr-14 text-xs font-medium text-muted">{event.organizer}</p>}
        <Link href={href} className="line-clamp-2 pr-14 text-lg font-bold leading-snug hover:text-accent">{event.name}</Link>

        <div className="mt-3 flex items-center gap-4 text-xs text-muted">
          <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" /> {event.participantCount.toLocaleString()}</span>
          <span className="inline-flex items-center gap-1"><CircleCheck className="h-3.5 w-3.5" /> {event.claimedCount.toLocaleString()} claimed</span>
          {event.participantCount > 0 && <span className="ml-auto font-semibold tabular-nums text-ink">{Math.round(pct)}%</span>}
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-success-soft">
          <div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${pct}%` }} />
        </div>

        <div className="mt-4 flex items-center gap-2 border-t pt-3">
          {event.status === 'open' ? (
            <CopyLinkButton eventId={event.id} label="Copy link" className="btn-sm" />
          ) : nextStep ? (
            <Link href={nextStep.href} className="inline-flex items-center gap-1.5 text-xs font-semibold text-warning">
              <span className="h-1.5 w-1.5 rounded-full bg-warning" /> {nextStep.label}
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted"><Lock className="h-3.5 w-3.5" /> Claiming closed</span>
          )}
          <Link href={href} className="btn-ghost btn-sm ml-auto">
            Manage <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ isGuest, canCreate, defaultOrganizer }: { isGuest: boolean; canCreate: boolean; defaultOrganizer: string | null }) {
  const steps = [
    { icon: ImageUp, title: 'Upload your design', body: 'A PNG or JPG with a blank space where the name goes.' },
    { icon: ListChecks, title: 'Add your participants', body: 'Paste names or import a CSV. Only people on the list can claim.' },
    { icon: Send, title: 'Share or bulk-create', body: 'Send one claim link, or download every certificate at once.' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm text-muted">{isGuest ? 'Guest workspace' : 'Welcome to Certify'}</p>
        <h1 className="mt-0.5 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Create your first event</h1>
        <p className="mt-1.5 text-muted">
          {isGuest ? 'No account needed to try it. It takes about two minutes.' : 'It takes about two minutes.'}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <NewEventButton defaultOrganizer={defaultOrganizer}
          canCreate={canCreate}
          className="group card relative flex min-h-80 flex-col items-center justify-center overflow-hidden border-2 border-dashed border-line-strong bg-surface p-8 text-center transition-colors hover:border-accent hover:bg-accent-soft/30 lg:col-span-7"
        >
          {/* A small certificate shape so it's obvious what goes here. */}
          <span className="relative flex aspect-[1.414/1] w-44 items-center justify-center rounded-lg border-4 border-[#c9a55a]/60 bg-[#fbf8ef] shadow-card transition-transform duration-300 group-hover:-rotate-2 group-hover:scale-105">
            <span className="absolute inset-1.5 rounded-sm border border-[#c9a55a]/40" />
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-white shadow-pop">
              <ImageUp className="h-5 w-5" />
            </span>
          </span>
          <span className="relative mt-5 text-lg font-bold">Upload your certificate design</span>
          <span className="relative mt-1 max-w-xs text-sm text-muted">Then you&apos;ll place the name and add your participants.</span>
          <span className="btn-primary relative mt-6 shadow-pop">
            <Plus className="h-4 w-4" /> Start a new event
          </span>
        </NewEventButton>

        <div className="card p-6 lg:col-span-5">
          <h2 className="text-sm font-bold">How it works</h2>
          <ol className="mt-5 space-y-5">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent">
                  <s.icon className="h-5 w-5" />
                  <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-canvas">{i + 1}</span>
                </span>
                <div>
                  <h3 className="font-semibold">{s.title}</h3>
                  <p className="mt-0.5 text-sm text-muted">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          {isGuest && (
            <p className="mt-6 rounded-xl bg-sunken px-4 py-3 text-xs leading-relaxed text-muted">
              As a guest you can design an event and add participants. Sharing the claim link and bulk create need a free account.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
