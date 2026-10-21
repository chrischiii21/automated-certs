import { getUserProfile } from '@/lib/accounts';
import { getViewer } from '@/lib/auth';
import { listEvents } from '@/lib/data';
import { Dashboard } from '@/components/admin/Dashboard';

export default async function AdminDashboard() {
  const viewer = await getViewer();
  const events = viewer ? await listEvents(viewer.ownerId) : [];
  const isGuest = viewer?.kind !== 'user';
  const profile = viewer?.kind === 'user' ? await getUserProfile(viewer.userId) : null;

  return (
    <Dashboard
      events={events}
      isGuest={isGuest}
      // Guests get one event to try; creating another needs an account.
      canCreate={!isGuest || events.length === 0}
      greetingName={profile?.name?.split(' ')[0] ?? null}
      defaultOrganizer={profile?.organization ?? null}
    />
  );
}
