'use server';

import { del } from '@vercel/blob';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { endSession, ensureViewer, getViewer, requireUser } from '@/lib/auth';
import { suggestNameStyle } from '@/lib/ai';
import { sanitizeLayout } from '@/lib/certificate';
import * as data from '@/lib/data';
import type { EventStatus, NameLayout } from '@/lib/types';

/** Guests can try one event before they need an account. */
const GUEST_EVENT_LIMIT = 1;

function assertTemplateUrl(url: string) {
  const { protocol, hostname } = new URL(url);
  const isBlob = protocol === 'https:' && hostname.endsWith('.blob.vercel-storage.com');
  if (!isBlob && process.env.NODE_ENV === 'production') throw new Error('Invalid template URL');
}

async function deleteBlob(url: string) {
  if (!url.includes('.blob.vercel-storage.com')) return;
  try {
    await del(url);
  } catch (err) {
    console.error('Failed to delete template blob', err);
  }
}

function refresh(eventId?: string) {
  revalidatePath('/admin');
  if (eventId) revalidatePath(`/admin/events/${eventId}`);
}

/** Loads the event if the current user or guest owns it; otherwise acts as if it doesn't exist. */
async function ownedEvent(eventId: string) {
  const viewer = await getViewer();
  const event = viewer && (await data.getOwnedEvent(String(eventId), viewer.ownerId));
  if (!event) throw new Error('Event not found');
  return event;
}

const cleanOrganizer = (organizer: string | null | undefined) => organizer?.trim().slice(0, 200) || null;

export async function createEventAction(input: { name: string; templateUrl: string; logoUrl?: string | null; organizer?: string | null }) {
  const viewer = await ensureViewer();
  if (viewer.kind === 'guest' && (await data.countEvents(viewer.ownerId)) >= GUEST_EVENT_LIMIT) {
    throw new Error('SIGNUP_REQUIRED');
  }
  const name = input.name.trim();
  if (!name) throw new Error('Event name is required');
  assertTemplateUrl(input.templateUrl);
  if (input.logoUrl) assertTemplateUrl(input.logoUrl);
  const id = await data.createEvent({
    ownerId: viewer.ownerId,
    name: name.slice(0, 200),
    templateUrl: input.templateUrl,
    logoUrl: input.logoUrl || null,
    organizer: cleanOrganizer(input.organizer),
  });
  refresh();
  redirect(`/admin/events/${id}?tab=design`);
}

export async function saveLayoutAction(eventId: string, layout: NameLayout) {
  await ownedEvent(eventId);
  await data.updateEventLayout(eventId, sanitizeLayout(layout));
  refresh(eventId);
}

export async function setStatusAction(eventId: string, status: EventStatus) {
  await ownedEvent(eventId);
  if (!['draft', 'open', 'closed'].includes(status)) throw new Error('Invalid status');
  // Sharing a claim link is an account feature.
  if (status === 'open') await requireUser();
  await data.updateEventDetails(eventId, { status });
  refresh(eventId);
}

export async function renameEventAction(eventId: string, name: string) {
  await ownedEvent(eventId);
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Event name is required');
  await data.updateEventDetails(eventId, { name: trimmed.slice(0, 200) });
  refresh(eventId);
}

export async function replaceTemplateAction(eventId: string, templateUrl: string) {
  const event = await ownedEvent(eventId);
  assertTemplateUrl(templateUrl);
  await data.updateEventDetails(eventId, { templateUrl });
  await deleteBlob(event.templateUrl);
  refresh(eventId);
}

/** Updates the organizer name and/or logo shown on the claim page. Pass logoUrl: null to remove the logo. */
export async function updateBrandingAction(eventId: string, input: { organizer?: string | null; logoUrl?: string | null }) {
  const event = await ownedEvent(eventId);
  if (input.logoUrl) assertTemplateUrl(input.logoUrl);
  await data.updateEventDetails(eventId, {
    organizer: input.organizer === undefined ? undefined : cleanOrganizer(input.organizer),
    logoUrl: input.logoUrl,
  });
  if (input.logoUrl !== undefined && event.logoUrl && event.logoUrl !== input.logoUrl) await deleteBlob(event.logoUrl);
  refresh(eventId);
}

export async function suggestStyleAction(eventId: string, size: { width: number; height: number }, sampleName: string) {
  await requireUser();
  const event = await ownedEvent(eventId);
  const width = Math.round(Number(size.width));
  const height = Math.round(Number(size.height));
  if (!(width > 0 && height > 0)) throw new Error('Invalid template size');
  return suggestNameStyle(event.templateUrl, { width, height }, String(sampleName || 'Juan Dela Cruz').slice(0, 120));
}

export async function deleteEventAction(eventId: string) {
  const event = await ownedEvent(eventId);
  await data.deleteEvent(eventId);
  await deleteBlob(event.templateUrl);
  if (event.logoUrl) await deleteBlob(event.logoUrl);
  refresh();
  redirect('/admin');
}

export async function importParticipantsAction(eventId: string, names: string[], replace: boolean) {
  await ownedEvent(eventId);
  if (!Array.isArray(names) || names.length > 20000) throw new Error('Too many names in one import (max 20,000)');
  const added = await data.addParticipants(
    eventId,
    names.filter((n) => typeof n === 'string').map((n) => n.slice(0, 200)),
    replace,
  );
  refresh(eventId);
  return { added };
}

export async function removeParticipantAction(eventId: string, participantId: string) {
  await ownedEvent(eventId);
  await data.removeParticipant(eventId, participantId);
  refresh(eventId);
}

export async function removeParticipantsAction(eventId: string, participantIds: string[]) {
  await ownedEvent(eventId);
  if (!Array.isArray(participantIds)) throw new Error('Invalid selection');
  await data.removeParticipants(eventId, participantIds.filter((id) => typeof id === 'string'));
  refresh(eventId);
}

export async function renameParticipantAction(eventId: string, participantId: string, name: string) {
  await ownedEvent(eventId);
  const ok = await data.renameParticipant(eventId, participantId, String(name).slice(0, 200));
  if (ok) refresh(eventId);
  return { ok };
}

export async function logoutAction() {
  await endSession();
  redirect('/login');
}
