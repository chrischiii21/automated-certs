import { cn } from '@/lib/utils';
import type { EventStatus } from '@/lib/types';

const STYLES: Record<EventStatus, { label: string; className: string; dot: string }> = {
  draft: { label: 'Draft', className: 'bg-sunken text-muted', dot: 'bg-faint' },
  open: { label: 'Claiming open', className: 'bg-success-soft text-success', dot: 'bg-success' },
  closed: { label: 'Closed', className: 'bg-warning-soft text-warning', dot: 'bg-warning' },
};

export function StatusBadge({ status, className }: { status: EventStatus; className?: string }) {
  const s = STYLES[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', s.className, className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s.dot)} />
      {s.label}
    </span>
  );
}
