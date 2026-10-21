"use client";

import { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowDown, ArrowUp, Check, Download, FileArchive, FileText, FileUp, Loader2, Search, Sparkles, Trash2, UserPlus, Users,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { nameKey, parseNames } from '@/lib/names';
import { BULK_PART_SIZE, generateCertificates, type BulkFormat } from '@/lib/bulk';
import { importParticipantsAction, removeParticipantAction, removeParticipantsAction, renameParticipantAction } from '@/app/admin/actions';
import { Modal } from '@/components/ui/Modal';
import type { CertEvent, Participant } from '@/lib/types';

const PAGE = 300;

type Filter = 'all' | 'claimed' | 'unclaimed';
type SortKey = 'name' | 'status' | 'claimed' | 'downloads' | 'added';

export function ParticipantsPanel({ event, participants, isGuest }: { event: CertEvent; participants: Participant[]; isGuest: boolean }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: 'name', dir: 1 });
  const [limit, setLimit] = useState(PAGE);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importOpen, setImportOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [single, setSingle] = useState('');
  const [adding, setAdding] = useState(false);

  // Row numbers follow the order names were added, like rows in a spreadsheet.
  const rowNumber = useMemo(() => {
    const byAdded = [...participants].sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.name.localeCompare(b.name));
    return new Map(byAdded.map((p, i) => [p.id, i + 1]));
  }, [participants]);

  const visible = useMemo(() => {
    const q = nameKey(query);
    const rows = participants.filter(
      (p) => (filter === 'all' || (filter === 'claimed') === p.claimCount > 0) && (!q || nameKey(p.name).includes(q)),
    );
    const value = (p: Participant): string | number => {
      switch (sort.key) {
        case 'name': return p.name.toLowerCase();
        case 'status': return p.claimCount > 0 ? 1 : 0;
        case 'claimed': return p.firstClaimedAt ?? '';
        case 'downloads': return p.claimCount;
        case 'added': return rowNumber.get(p.id)!;
      }
    };
    return rows.sort((a, b) => (value(a) < value(b) ? -1 : value(a) > value(b) ? 1 : 0) * sort.dir);
  }, [participants, query, filter, sort, rowNumber]);

  // Drop selections for rows that no longer exist (after deletes / replace).
  const liveSelected = useMemo(() => new Set([...selected].filter((id) => rowNumber.has(id))), [selected, rowNumber]);
  const allVisibleSelected = visible.length > 0 && visible.every((p) => liveSelected.has(p.id));

  const toggleAll = () =>
    setSelected(allVisibleSelected ? new Set() : new Set(visible.map((p) => p.id)));
  const toggle = (id: string) =>
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const sortBy = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key ? (s.dir === 1 ? -1 : 1) : 1 }));

  const addOne = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!single.trim()) return;
    setAdding(true);
    try {
      const { added } = await importParticipantsAction(event.id, [single], false);
      toast[added ? 'success' : 'info'](added ? `Added ${single.trim()}` : 'That name is already on the list');
      if (added) setSingle('');
    } catch {
      toast.error('Could not add the name');
    } finally {
      setAdding(false);
    }
  };

  const deleteSelected = async () => {
    const ids = [...liveSelected];
    if (!window.confirm(`Remove ${ids.length} participant${ids.length === 1 ? '' : 's'} from the list?`)) return;
    try {
      await removeParticipantsAction(event.id, ids);
      setSelected(new Set());
      toast.success(`Removed ${ids.length} participant${ids.length === 1 ? '' : 's'}`);
    } catch {
      toast.error('Could not remove the selected participants');
    }
  };

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ['#', 'Name', 'Claimed', 'First claimed at', 'Times downloaded'],
      ...[...participants]
        .sort((a, b) => rowNumber.get(a.id)! - rowNumber.get(b.id)!)
        .map((p) => [String(rowNumber.get(p.id)), p.name, p.claimCount > 0 ? 'Yes' : 'No', p.firstClaimedAt ?? '', String(p.claimCount)]),
    ];
    const blob = new Blob(['﻿' + rows.map((r) => r.map(esc).join(',')).join('\r\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${event.name.replace(/[^\w-]+/g, '-').toLowerCase()}-participants.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (participants.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <ImportCard eventId={event.id} existingCount={0} />
        </div>
        <div className="card flex flex-col items-center justify-center gap-2 px-6 py-16 text-center lg:col-span-7">
          <Users className="h-8 w-8 text-faint" />
          <p className="font-semibold">No participants yet</p>
          <p className="max-w-sm text-sm text-muted">
            Import your list. Then either open claiming so people download their own certificate, or bulk-create every
            certificate yourself.
          </p>
        </div>
      </div>
    );
  }

  const bulkNames = liveSelected.size
    ? visible.filter((p) => liveSelected.has(p.id)).map((p) => p.name)
    : visible.map((p) => p.name);

  return (
    <div className="space-y-5">
      <ParticipantStats participants={participants} />

      <section className="card overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b p-3">
          <div className="relative min-w-48 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
            <input className="input h-9 pl-9" placeholder="Search names" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(PAGE); }} />
          </div>
          <div className="flex gap-0.5 rounded-lg bg-sunken p-0.5 text-xs">
            {(['all', 'claimed', 'unclaimed'] as const).map((f) => (
              <button
                key={f}
                onClick={() => { setFilter(f); setLimit(PAGE); }}
                className={cn('h-8 rounded-md px-2.5 font-semibold transition-colors', filter === f ? 'bg-surface shadow-card' : 'text-muted hover:text-ink')}
              >
                {{ all: 'All', claimed: 'Claimed', unclaimed: 'Not yet' }[f]}
              </button>
            ))}
          </div>
          <form onSubmit={addOne} className="flex gap-1.5">
            <input className="input h-9 w-44" placeholder="Add a name…" value={single} onChange={(e) => setSingle(e.target.value)} />
            <button className="btn-secondary btn-sm h-9" disabled={adding || !single.trim()} aria-label="Add name">
              {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            </button>
          </form>
          <div className="ml-auto flex gap-1.5">
            <button className="btn-secondary btn-sm h-9" onClick={() => setImportOpen(true)}>
              <FileUp className="h-3.5 w-3.5" /> Import
            </button>
            <button className="btn-secondary btn-sm h-9" onClick={exportCsv}>
              <Download className="h-3.5 w-3.5" /> Export
            </button>
            {isGuest ? (
              <Link href={`/signup?next=${encodeURIComponent(`/admin/events/${event.id}?tab=participants`)}`} className="btn-primary btn-sm h-9" title="Bulk create needs a free account">
                <Sparkles className="h-3.5 w-3.5" /> Sign up to bulk create
              </Link>
            ) : (
              <button className="btn-primary btn-sm h-9" onClick={() => setBulkOpen(true)}>
                <Sparkles className="h-3.5 w-3.5" /> Bulk create
              </button>
            )}
          </div>
        </div>

        {/* Spreadsheet */}
        <div className="max-h-[min(640px,70vh)] overflow-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-sunken text-[10px] font-medium text-faint">
                <th className="w-10 border border-line" />
                <th className="w-12 border border-line" />
                {['A', 'B', 'C', 'D'].map((c) => <th key={c} className="border border-line py-0.5">{c}</th>)}
                <th className="w-10 border border-line" />
              </tr>
              <tr className="bg-sunken text-left text-xs font-semibold text-muted">
                <th className="border border-line px-2 py-1.5 text-center">
                  <input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} aria-label="Select all rows" className="accent-accent" />
                </th>
                <SortHeader label="#" k="added" sort={sort} onSort={sortBy} className="text-center" />
                <SortHeader label="Name" k="name" sort={sort} onSort={sortBy} />
                <SortHeader label="Status" k="status" sort={sort} onSort={sortBy} className="w-32" />
                <SortHeader label="First claimed" k="claimed" sort={sort} onSort={sortBy} className="w-44" />
                <SortHeader label="Downloads" k="downloads" sort={sort} onSort={sortBy} className="w-28 text-right" />
                <th className="border border-line" />
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, limit).map((p) => (
                <SheetRow
                  key={p.id}
                  eventId={event.id}
                  participant={p}
                  number={rowNumber.get(p.id)!}
                  selected={liveSelected.has(p.id)}
                  onToggle={() => toggle(p.id)}
                />
              ))}
              {visible.length === 0 && (
                <tr><td colSpan={7} className="border border-line px-4 py-10 text-center text-sm text-muted">No names match.</td></tr>
              )}
            </tbody>
          </table>
          {visible.length > limit && (
            <div className="border-t p-2 text-center">
              <button className="btn-ghost btn-sm" onClick={() => setLimit((l) => l + PAGE)}>
                Show more ({(visible.length - limit).toLocaleString()} more rows)
              </button>
            </div>
          )}
        </div>

        {/* Status bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t bg-sunken px-3 py-1.5 text-xs text-muted">
          <span>Rows: <b className="tabular-nums text-ink">{participants.length.toLocaleString()}</b></span>
          {visible.length !== participants.length && <span>Showing: <b className="tabular-nums text-ink">{visible.length.toLocaleString()}</b></span>}
          <span>Claimed: <b className="tabular-nums text-ink">{participants.filter((p) => p.claimCount > 0).length.toLocaleString()}</b></span>
          {liveSelected.size > 0 && (
            <>
              <span>Selected: <b className="tabular-nums text-ink">{liveSelected.size.toLocaleString()}</b></span>
              <button className="font-semibold text-danger hover:underline" onClick={deleteSelected}>Delete selected</button>
              <button className="font-semibold text-accent hover:underline" onClick={() => setSelected(new Set())}>Clear selection</button>
            </>
          )}
          <span className="ml-auto hidden sm:inline">Double-click a name to fix its spelling</span>
        </div>
      </section>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import participants">
        <ImportCard eventId={event.id} existingCount={participants.length} onDone={() => setImportOpen(false)} bare />
      </Modal>

      <BulkCreateModal
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        event={event}
        names={bulkNames}
        scope={liveSelected.size ? 'selected' : visible.length === participants.length ? 'all' : 'filtered'}
      />
    </div>
  );
}

function SortHeader({ label, k, sort, onSort, className }: {
  label: string;
  k: SortKey;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (k: SortKey) => void;
  className?: string;
}) {
  const active = sort.key === k;
  const Arrow = sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <th className={cn('border border-line p-0', className)} aria-sort={active ? (sort.dir === 1 ? 'ascending' : 'descending') : undefined}>
      <button
        onClick={() => onSort(k)}
        className={cn('flex w-full items-center gap-1 px-2 py-1.5 hover:text-ink', className?.includes('text-right') && 'justify-end', className?.includes('text-center') && 'justify-center')}
      >
        {label}
        {active && <Arrow className="h-3 w-3" />}
      </button>
    </th>
  );
}

function SheetRow({ eventId, participant: p, number, selected, onToggle }: {
  eventId: string;
  participant: Participant;
  number: number;
  selected: boolean;
  onToggle: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(p.name);
  const [busy, setBusy] = useState(false);

  const commit = async () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === p.name) return setDraft(p.name);
    setBusy(true);
    try {
      const { ok } = await renameParticipantAction(eventId, p.id, next);
      if (ok) toast.success(`Renamed to ${next}`);
      else {
        toast.error('Another participant already has that name');
        setDraft(p.name);
      }
    } catch {
      toast.error('Could not rename');
      setDraft(p.name);
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    const warning = p.claimCount > 0 ? ' They have already claimed their certificate.' : '';
    if (!window.confirm(`Remove ${p.name} from the list?${warning}`)) return;
    setBusy(true);
    try {
      await removeParticipantAction(eventId, p.id);
    } catch {
      toast.error('Could not remove the participant');
      setBusy(false);
    }
  };

  const cell = 'border border-line px-2 py-1.5';
  return (
    <tr className={cn('group', selected ? 'bg-accent-soft/70' : 'bg-surface hover:bg-canvas')}>
      <td className={cn(cell, 'text-center')}>
        <input type="checkbox" checked={selected} onChange={onToggle} aria-label={`Select ${p.name}`} className="accent-accent" />
      </td>
      <td className={cn(cell, 'bg-sunken/60 text-center text-xs tabular-nums text-faint')}>{number}</td>
      <td className={cn(cell, 'p-0', editing && 'outline-2 -outline-offset-2 outline-accent')} onDoubleClick={() => !busy && setEditing(true)}>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur();
              if (e.key === 'Escape') { setDraft(p.name); setEditing(false); }
            }}
            className="h-full w-full bg-surface px-2 py-1.5 font-medium outline-none"
          />
        ) : (
          <span className={cn('block cursor-cell truncate px-2 py-1.5 font-medium', busy && 'opacity-50')}>{draft}</span>
        )}
      </td>
      <td className={cell}>
        {p.claimCount > 0 ? (
          <span className="inline-flex items-center gap-1 font-semibold text-success"><Check className="h-3.5 w-3.5" /> Claimed</span>
        ) : (
          <span className="text-faint">Not yet</span>
        )}
      </td>
      <td className={cn(cell, 'text-xs tabular-nums text-muted')} suppressHydrationWarning>
        {p.firstClaimedAt ? new Date(p.firstClaimedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : ''}
      </td>
      <td className={cn(cell, 'text-right tabular-nums')}>{p.claimCount || ''}</td>
      <td className={cn(cell, 'px-1 text-center')}>
        <button
          onClick={remove}
          disabled={busy}
          className="rounded p-1 text-faint opacity-0 transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
          aria-label={`Remove ${p.name}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </td>
    </tr>
  );
}

// ── Numbers at a glance ─────────────────────────────────────────────

function ParticipantStats({ participants }: { participants: Participant[] }) {
  const total = participants.length;
  const claimed = participants.filter((p) => p.claimCount > 0).length;
  const downloads = participants.reduce((sum, p) => sum + p.claimCount, 0);
  const rate = total ? claimed / total : 0;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
      <div className="grid grid-cols-2 gap-3 md:col-span-7 lg:col-span-6">
        <StatTile label="Participants" value={total} />
        <StatTile label="Claimed" value={claimed} note={`${downloads.toLocaleString()} total downloads`} />
        <StatTile label="Not yet claimed" value={total - claimed} />
        <div className="card p-4">
          <div className="text-xs text-muted">Claim rate</div>
          <div className="mt-1 text-2xl font-semibold">{Math.round(rate * 100)}%</div>
          {/* Meter: the track is a lighter step of the fill's hue. */}
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-success-soft" role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(rate * 100)} aria-label="Claim rate">
            <div className="h-full rounded-full bg-success transition-[width] duration-500" style={{ width: `${rate * 100}%` }} />
          </div>
        </div>
      </div>
      <ClaimsChart participants={participants} className="md:col-span-5 lg:col-span-6" />
    </div>
  );
}

function StatTile({ label, value, note }: { label: string; value: number; note?: string }) {
  return (
    <div className="card p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value.toLocaleString()}</div>
      {note && <div className="mt-0.5 text-xs text-faint">{note}</div>}
    </div>
  );
}

const DAYS = 14;

function ClaimsChart({ participants, className }: { participants: Participant[]; className?: string }) {
  const [hover, setHover] = useState<number | null>(null);

  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const buckets = Array.from({ length: DAYS }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - (DAYS - 1 - i));
      return { date: d, count: 0 };
    });
    for (const p of participants) {
      if (!p.firstClaimedAt) continue;
      const d = new Date(p.firstClaimedAt);
      d.setHours(0, 0, 0, 0);
      const idx = Math.round((d.getTime() - buckets[0].date.getTime()) / 86_400_000);
      if (idx >= 0 && idx < DAYS) buckets[idx].count++;
    }
    return buckets;
  }, [participants]);

  const max = Math.max(1, ...days.map((d) => d.count));
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const shown = hover ?? null;

  return (
    <div className={cn('card flex flex-col p-4', className)}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-xs text-muted">Claims per day · last {DAYS} days</div>
        <div className="text-xs tabular-nums text-muted" suppressHydrationWarning>
          {shown !== null ? <><b className="text-ink">{days[shown].count}</b> on {fmt(days[shown].date)}</> : <>peak <b className="text-ink">{max === 1 && days.every((d) => !d.count) ? 0 : max}</b>/day</>}
        </div>
      </div>
      <div className="relative mt-3 flex min-h-28 flex-1 items-end gap-0.5" onMouseLeave={() => setHover(null)}>
        {/* Recessive baseline */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 border-b border-line" />
        {days.map((d, i) => (
          <div
            key={i}
            className="flex h-full flex-1 cursor-default items-end"
            onMouseEnter={() => setHover(i)}
            role="img"
            aria-label={`${d.count} claims on ${fmt(d.date)}`}
            suppressHydrationWarning
          >
            <div
              className={cn('w-full rounded-t-[4px] transition-colors', d.count ? (hover === i ? 'bg-accent-hover' : 'bg-accent') : 'bg-transparent')}
              style={{ height: d.count ? `${Math.max(4, (d.count / max) * 100)}%` : 0 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-faint" suppressHydrationWarning>
        <span>{fmt(days[0].date)}</span>
        <span>Today</span>
      </div>
    </div>
  );
}

// ── Bulk create ─────────────────────────────────────────────────────

function BulkCreateModal({ open, onClose, event, names, scope }: {
  open: boolean;
  onClose: () => void;
  event: CertEvent;
  names: string[];
  scope: 'all' | 'selected' | 'filtered';
}) {
  const [format, setFormat] = useState<BulkFormat>('pdf');
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const running = progress !== null;

  const start = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setProgress({ done: 0, total: names.length });
    try {
      await generateCertificates({
        eventName: event.name,
        templateUrl: event.templateUrl,
        layout: event.layout,
        names,
        format,
        signal: controller.signal,
        onProgress: (done, total) => setProgress({ done, total }),
      });
      if (!controller.signal.aborted) {
        toast.success(`Created ${names.length.toLocaleString()} certificate${names.length === 1 ? '' : 's'}`);
        onClose();
      }
    } catch (err) {
      console.error(err);
      toast.error('Could not create the certificates. Check that the template loads on the Design tab.');
    } finally {
      setProgress(null);
      abortRef.current = null;
    }
  };

  const parts = Math.ceil(names.length / BULK_PART_SIZE);
  const scopeLabel = { all: 'everyone on the list', selected: 'the selected rows', filtered: 'the rows currently shown' }[scope];

  return (
    <Modal
      open={open}
      onClose={() => (running ? abortRef.current?.abort() : onClose())}
      title="Bulk create certificates"
      description={`Generates ${names.length.toLocaleString()} certificate${names.length === 1 ? '' : 's'} for ${scopeLabel}, using your saved design. Claiming doesn't need to be open.`}
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {([
            { id: 'pdf', icon: FileText, title: 'One PDF', body: 'A page per participant. Best for printing or emailing.' },
            { id: 'zip', icon: FileArchive, title: 'ZIP of PNGs', body: 'One image file per participant, numbered.' },
          ] as const).map((o) => (
            <button
              key={o.id}
              onClick={() => setFormat(o.id)}
              disabled={running}
              className={cn(
                'rounded-xl border-2 p-3 text-left transition-colors',
                format === o.id ? 'border-accent bg-accent-soft/60' : 'border-line hover:border-line-strong',
              )}
            >
              <o.icon className={cn('h-5 w-5', format === o.id ? 'text-accent' : 'text-muted')} />
              <div className="mt-2 text-sm font-semibold">{o.title}</div>
              <div className="mt-0.5 text-xs text-muted">{o.body}</div>
            </button>
          ))}
        </div>

        {parts > 1 && (
          <p className="rounded-lg bg-sunken px-3 py-2 text-xs text-muted">
            Large list: this downloads as {parts} files of up to {BULK_PART_SIZE} certificates each, so your browser doesn&apos;t run out of memory.
          </p>
        )}

        {running && (
          <div>
            <div className="flex justify-between text-xs text-muted">
              <span>Creating certificates…</span>
              <span className="tabular-nums">{progress.done.toLocaleString()} / {progress.total.toLocaleString()}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-accent-soft">
              <div className="h-full rounded-full bg-accent transition-[width]" style={{ width: `${(progress.done / progress.total) * 100}%` }} />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          {running ? (
            <button className="btn-secondary" onClick={() => abortRef.current?.abort()}>Cancel</button>
          ) : (
            <>
              <button className="btn-ghost" onClick={onClose}>Close</button>
              <button className="btn-primary" onClick={start} disabled={names.length === 0}>
                <Download className="h-4 w-4" />
                Create {names.length.toLocaleString()}
              </button>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ── Import ──────────────────────────────────────────────────────────

function ImportCard({ eventId, existingCount, onDone, bare }: { eventId: string; existingCount: number; onDone?: () => void; bare?: boolean }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [replace, setReplace] = useState(false);
  const [busy, setBusy] = useState(false);

  const names = useMemo(() => parseNames(text), [text]);
  const uniqueCount = useMemo(() => new Set(names.map(nameKey)).size, [names]);

  const readFile = async (file: File | undefined) => {
    if (!file) return;
    if (/\.(xlsx?|numbers|ods)$/i.test(file.name)) {
      toast.error('Spreadsheet files must be exported as CSV first (File → Download/Save as → CSV).');
      return;
    }
    setText(await file.text());
    setFileName(file.name);
  };

  const submit = async () => {
    if (names.length === 0) return;
    if (replace && existingCount > 0 && !window.confirm(`Replace all ${existingCount} existing names? Claim history for removed names will be lost.`)) return;
    setBusy(true);
    try {
      const { added } = await importParticipantsAction(eventId, names, replace);
      const skipped = names.length - added;
      toast.success(`Imported ${added.toLocaleString()} name${added === 1 ? '' : 's'}${skipped ? ` · ${skipped} already on the list or duplicated` : ''}`);
      setText('');
      setFileName(null);
      setReplace(false);
      onDone?.();
    } catch (err) {
      toast.error((err as Error).message || 'Import failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className={cn('space-y-4', !bare && 'card p-4')}>
      <div>
        {!bare && <h3 className="font-bold">Import participants</h3>}
        <p className={cn('text-sm text-muted', !bare && 'mt-1')}>
          Paste names one per line, or upload a CSV. If the CSV has a <b>Name</b> column (or <b>First name</b> + <b>Last name</b>), we&apos;ll use it.
        </p>
      </div>

      <div onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); readFile(e.dataTransfer.files[0]); }}>
        <textarea
          value={text}
          onChange={(e) => { setText(e.target.value); setFileName(null); }}
          placeholder={'Juan Dela Cruz\nMaria Santos\nJosé Rizal'}
          rows={8}
          className="input h-auto resize-y py-2.5 font-mono text-[13px] leading-relaxed"
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-secondary btn-sm" onClick={() => fileRef.current?.click()}>
          <FileUp className="h-3.5 w-3.5" />
          Upload CSV / TXT
        </button>
        {fileName && <span className="truncate text-xs text-muted">{fileName}</span>}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.txt,.tsv,text/csv,text/plain"
          className="hidden"
          onChange={(e) => { readFile(e.target.files?.[0]); e.target.value = ''; }}
        />
      </div>

      {names.length > 0 && (
        <div className="rounded-xl bg-sunken p-3 text-sm">
          <p>
            <b>{uniqueCount.toLocaleString()}</b> name{uniqueCount === 1 ? '' : 's'} found
            {names.length !== uniqueCount && <span className="text-muted"> ({names.length - uniqueCount} duplicates will be skipped)</span>}
          </p>
          <p className="mt-1 truncate text-xs text-muted">
            {names.slice(0, 4).join(' · ')}{names.length > 4 && ' · …'}
          </p>
        </div>
      )}

      {existingCount > 0 && (
        <fieldset className="space-y-1.5 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" checked={!replace} onChange={() => setReplace(false)} className="accent-accent" />
            Add to the existing {existingCount.toLocaleString()} names
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" checked={replace} onChange={() => setReplace(true)} className="accent-accent" />
            Replace the whole list
          </label>
        </fieldset>
      )}

      <button className="btn-primary w-full" onClick={submit} disabled={busy || names.length === 0}>
        {busy && <Loader2 className="h-4 w-4 animate-spin" />}
        {names.length ? `Import ${uniqueCount.toLocaleString()} name${uniqueCount === 1 ? '' : 's'}` : 'Import names'}
      </button>
      <p className="text-xs text-faint">
        Matching ignores capitalization, accents, punctuation and extra spaces. The certificate shows the name exactly as written here.
      </p>
    </section>
  );
}
