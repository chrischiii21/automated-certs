"use client";

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Loader2, Lock, Palette, Settings, Users } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { setStatusAction } from '@/app/admin/actions';
import type { CertEvent, EventStatus, Participant } from '@/lib/types';
import { CanvasEditor } from './CanvasEditor';
import { CopyLinkButton } from './CopyLinkButton';
import { ParticipantsPanel } from './ParticipantsPanel';
import { SettingsPanel } from './SettingsPanel';
import { StatusBadge } from './StatusBadge';

export type Tab = 'design' | 'participants' | 'settings';

interface Props {
  event: CertEvent;
  participants: Participant[];
  initialTab: Tab;
  aiEnabled: boolean;
  isGuest: boolean;
}

export function EventWorkspace({ event, participants, initialTab, aiEnabled, isGuest }: Props) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const claimed = participants.filter((p) => p.claimCount > 0).length;

  const selectTab = (t: Tab) => {
    setTab(t);
    window.history.replaceState(null, '', `?tab=${t}`);
  };

  const tabs: { id: Tab; label: string; icon: typeof Users; badge?: string }[] = [
    { id: 'design', label: 'Design', icon: Palette },
    { id: 'participants', label: 'Participants', icon: Users, badge: String(participants.length) },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-5">
      <div>
        <Link href="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted hover:text-ink">
          <ArrowLeft className="h-4 w-4" />
          All events
        </Link>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">{event.name}</h1>
              <StatusBadge status={event.status} />
            </div>
            <p className="mt-1 text-sm text-muted">
              {participants.length === 0
                ? 'No participants yet'
                : `${claimed} of ${participants.length} participants have claimed their certificate`}
            </p>
          </div>
          <StatusControls eventId={event.id} status={event.status} participantCount={participants.length} isGuest={isGuest} />
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-b [scrollbar-width:none]" aria-label="Event sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => selectTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
            className={cn(
              '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-semibold transition-colors outline-none focus-visible:rounded-t-lg focus-visible:bg-accent-soft',
              tab === t.id ? 'border-accent text-ink' : 'border-transparent text-muted hover:text-ink',
            )}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
            {t.badge !== undefined && (
              <span className={cn('rounded-full px-1.5 py-px text-[11px] tabular-nums', tab === t.id ? 'bg-accent-soft text-accent' : 'bg-sunken')}>
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Panels stay mounted so unsaved design changes survive switching tabs. */}
      <div hidden={tab !== 'design'}>
        <CanvasEditor
          eventId={event.id}
          templateUrl={event.templateUrl}
          initialLayout={event.layout}
          participantNames={participants.map((p) => p.name)}
          aiEnabled={aiEnabled}
          isGuest={isGuest}
        />
      </div>
      <div hidden={tab !== 'participants'}>
        <ParticipantsPanel event={event} participants={participants} isGuest={isGuest} />
      </div>
      <div hidden={tab !== 'settings'}>
        <SettingsPanel event={event} />
      </div>
    </div>
  );
}

function StatusControls({ eventId, status, participantCount, isGuest }: { eventId: string; status: EventStatus; participantCount: number; isGuest: boolean }) {
  const [pending, startTransition] = useTransition();

  const change = (next: EventStatus, message: string) =>
    startTransition(async () => {
      try {
        await setStatusAction(eventId, next);
        toast.success(message);
      } catch {
        toast.error('Could not update the event status');
      }
    });

  const spinner = pending && <Loader2 className="h-4 w-4 animate-spin" />;

  if (status === 'open') {
    return (
      <div className="flex flex-wrap gap-2">
        <a href={`/claim/${eventId}`} target="_blank" rel="noreferrer" className="btn-ghost">
          <ExternalLink className="h-4 w-4" />
          Preview
        </a>
        <CopyLinkButton eventId={eventId} />
        <button className="btn-secondary" disabled={pending} onClick={() => change('closed', 'Claiming closed')}>
          {spinner || <Lock className="h-4 w-4" />}
          Close claiming
        </button>
      </div>
    );
  }

  if (isGuest) {
    return (
      <div className="flex flex-col items-end gap-1.5">
        <Link href={`/signup?next=${encodeURIComponent(`/admin/events/${eventId}`)}`} className="btn-primary">
          <Lock className="h-4 w-4" />
          Sign up free to share
        </Link>
        <span className="text-xs text-muted">Sharing claim links and bulk create need a free account</span>
      </div>
    );
  }

  const blocked = participantCount === 0;
  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        className="btn-primary"
        disabled={pending || blocked}
        onClick={() => change('open', 'Claiming is open. Share the link with your participants.')}
      >
        {spinner}
        {status === 'closed' ? 'Reopen claiming' : 'Open claiming'}
      </button>
      <span className="text-xs text-muted">
        {blocked ? 'Add participants first' : 'Optional: you can also bulk-create from Participants'}
      </span>
    </div>
  );
}
