'use server';

import { claimByName, getEvent } from '@/lib/data';

export type ClaimResult =
  | { ok: true; name: string }
  | { ok: false; reason: 'not_found' | 'not_open' | 'invalid' };

/**
 * Checks the entered name against the organizer's participant list.
 * Only the matched name is returned — the list itself never reaches the browser.
 */
export async function claimCertificate(eventId: string, enteredName: string): Promise<ClaimResult> {
  const name = String(enteredName ?? '').trim();
  if (name.length < 2 || name.length > 200) return { ok: false, reason: 'invalid' };

  const event = await getEvent(eventId);
  if (!event || event.status !== 'open') return { ok: false, reason: 'not_open' };

  const matched = await claimByName(eventId, name);
  return matched ? { ok: true, name: matched } : { ok: false, reason: 'not_found' };
}
