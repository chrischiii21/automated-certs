import { notFound } from 'next/navigation';
import { getViewer } from '@/lib/auth';
import { isAiConfigured } from '@/lib/ai';
import { getOwnedEvent, listParticipants } from '@/lib/data';
import { EventWorkspace, type Tab } from '@/components/admin/EventWorkspace';

export default async function EventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab } = await searchParams;

  const viewer = await getViewer();
  const event = viewer && (await getOwnedEvent(id, viewer.ownerId));
  if (!event) notFound();
  const participants = await listParticipants(id);

  const initialTab: Tab =
    tab === 'design' || tab === 'participants' || tab === 'settings'
      ? tab
      : participants.length === 0 ? 'participants' : 'design';

  return (
    <EventWorkspace
      event={event}
      participants={participants}
      initialTab={initialTab}
      aiEnabled={isAiConfigured()}
      isGuest={viewer.kind !== 'user'}
    />
  );
}
