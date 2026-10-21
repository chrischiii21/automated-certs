import 'server-only';
import type { Row } from '@libsql/client';
import { db } from './db';
import { cleanName, nameKey } from './names';
import type { CertEvent, EventStatus, EventSummary, NameLayout, Participant } from './types';

function toEvent(r: Row): CertEvent {
  return {
    id: String(r.id),
    name: String(r.name),
    templateUrl: String(r.template_url),
    logoUrl: r.logo_url == null ? null : String(r.logo_url),
    organizer: r.organizer == null ? null : String(r.organizer),
    layout: {
      x: Number(r.hotspot_x),
      y: Number(r.hotspot_y),
      maxWidth: Number(r.max_width),
      fontFamily: String(r.font_family),
      fontWeight: Number(r.font_weight),
      fontSize: Number(r.font_size),
      color: String(r.font_color),
    },
    status: r.status as EventStatus,
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at),
  };
}

function toParticipant(r: Row): Participant {
  return {
    id: String(r.id),
    name: String(r.name),
    claimCount: Number(r.claim_count),
    firstClaimedAt: r.first_claimed_at == null ? null : String(r.first_claimed_at),
    lastClaimedAt: r.last_claimed_at == null ? null : String(r.last_claimed_at),
    createdAt: String(r.created_at),
  };
}

const NOW = `strftime('%Y-%m-%dT%H:%M:%fZ', 'now')`;

// ── Events ──────────────────────────────────────────────────────────

export async function listEvents(ownerId: string): Promise<EventSummary[]> {
  const { rows } = await (await db()).execute(`
    SELECT e.*,
      COUNT(p.id) AS participant_count,
      COALESCE(SUM(p.claim_count > 0), 0) AS claimed_count
    FROM events e
    LEFT JOIN participants p ON p.event_id = e.id
    WHERE e.owner_id = ?
    GROUP BY e.id
    ORDER BY e.created_at DESC`, [ownerId]);
  return rows.map((r) => ({
    ...toEvent(r),
    participantCount: Number(r.participant_count),
    claimedCount: Number(r.claimed_count),
  }));
}

export async function getEvent(id: string): Promise<CertEvent | null> {
  const { rows } = await (await db()).execute({ sql: 'SELECT * FROM events WHERE id = ?', args: [id] });
  return rows[0] ? toEvent(rows[0]) : null;
}

/** The event, only if it belongs to this owner (a user id or guest:<id>). */
export async function getOwnedEvent(id: string, ownerId: string): Promise<CertEvent | null> {
  const { rows } = await (await db()).execute({ sql: 'SELECT * FROM events WHERE id = ? AND owner_id = ?', args: [id, ownerId] });
  return rows[0] ? toEvent(rows[0]) : null;
}

export async function countEvents(ownerId: string): Promise<number> {
  const { rows } = await (await db()).execute({ sql: 'SELECT COUNT(*) AS n FROM events WHERE owner_id = ?', args: [ownerId] });
  return Number(rows[0].n);
}

export async function createEvent(input: {
  ownerId: string;
  name: string;
  templateUrl: string;
  logoUrl: string | null;
  organizer: string | null;
}): Promise<string> {
  const id = crypto.randomUUID();
  await (await db()).execute({
    sql: 'INSERT INTO events (id, owner_id, name, template_url, logo_url, organizer) VALUES (?, ?, ?, ?, ?, ?)',
    args: [id, input.ownerId, input.name, input.templateUrl, input.logoUrl, input.organizer],
  });
  return id;
}

export async function updateEventLayout(id: string, l: NameLayout) {
  await (await db()).execute({
    sql: `UPDATE events SET hotspot_x = ?, hotspot_y = ?, max_width = ?, font_family = ?,
      font_weight = ?, font_size = ?, font_color = ?, updated_at = ${NOW} WHERE id = ?`,
    args: [l.x, l.y, l.maxWidth, l.fontFamily, l.fontWeight, l.fontSize, l.color, id],
  });
}

export async function updateEventDetails(
  id: string,
  fields: Partial<{ name: string; templateUrl: string; status: EventStatus; logoUrl: string | null; organizer: string | null }>,
) {
  const columns = { name: 'name', templateUrl: 'template_url', status: 'status', logoUrl: 'logo_url', organizer: 'organizer' } as const;
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined) as [keyof typeof columns, string | null][];
  if (entries.length === 0) return;
  await (await db()).execute({
    sql: `UPDATE events SET ${entries.map(([k]) => `${columns[k]} = ?`).join(', ')}, updated_at = ${NOW} WHERE id = ?`,
    args: [...entries.map(([, v]) => v), id],
  });
}

export async function deleteEvent(id: string) {
  // Delete participants explicitly: SQLite only cascades when foreign_keys is on for the connection.
  await (await db()).batch(
    [
      { sql: 'DELETE FROM participants WHERE event_id = ?', args: [id] },
      { sql: 'DELETE FROM events WHERE id = ?', args: [id] },
    ],
    'write',
  );
}

// ── Participants ────────────────────────────────────────────────────

export async function listParticipants(eventId: string): Promise<Participant[]> {
  const { rows } = await (await db()).execute({
    sql: 'SELECT * FROM participants WHERE event_id = ? ORDER BY name COLLATE NOCASE',
    args: [eventId],
  });
  return rows.map(toParticipant);
}

/** Adds names to the list (duplicates are skipped). Returns how many were new. */
export async function addParticipants(eventId: string, names: string[], replace: boolean): Promise<number> {
  const client = await db();
  const unique = new Map<string, string>();
  for (const raw of names) {
    const name = cleanName(raw);
    const key = nameKey(name);
    if (key && !unique.has(key)) unique.set(key, name);
  }

  const inserts = [...unique].map(([key, name]) => ({
    sql: 'INSERT OR IGNORE INTO participants (id, event_id, name, name_key) VALUES (?, ?, ?, ?)',
    args: [crypto.randomUUID(), eventId, name, key],
  }));

  let added = 0;
  const tx = await client.transaction('write');
  try {
    if (replace) await tx.execute({ sql: 'DELETE FROM participants WHERE event_id = ?', args: [eventId] });
    for (let i = 0; i < inserts.length; i += 500) {
      const results = await tx.batch(inserts.slice(i, i + 500));
      added += results.reduce((sum, r) => sum + r.rowsAffected, 0);
    }
    await tx.commit();
  } finally {
    tx.close();
  }
  return added;
}

export async function removeParticipant(eventId: string, participantId: string) {
  await (await db()).execute({
    sql: 'DELETE FROM participants WHERE id = ? AND event_id = ?',
    args: [participantId, eventId],
  });
}

/** Looks up a participant by name (forgiving match) and records the claim. */
export async function claimByName(eventId: string, name: string): Promise<string | null> {
  const { rows } = await (await db()).execute({
    sql: `UPDATE participants
      SET claim_count = claim_count + 1,
          first_claimed_at = COALESCE(first_claimed_at, ${NOW}),
          last_claimed_at = ${NOW}
      WHERE event_id = ? AND name_key = ?
      RETURNING name`,
    args: [eventId, nameKey(name)],
  });
  return rows[0] ? String(rows[0].name) : null;
}

export async function removeParticipants(eventId: string, participantIds: string[]) {
  if (participantIds.length === 0) return;
  const client = await db();
  for (let i = 0; i < participantIds.length; i += 500) {
    const ids = participantIds.slice(i, i + 500);
    await client.execute({
      sql: `DELETE FROM participants WHERE event_id = ? AND id IN (${ids.map(() => '?').join(',')})`,
      args: [eventId, ...ids],
    });
  }
}

/** Fixes a name's spelling. Returns false if the new name matches someone else already on the list. */
export async function renameParticipant(eventId: string, participantId: string, name: string): Promise<boolean> {
  const clean = cleanName(name);
  const key = nameKey(clean);
  if (!key) return false;
  const { rows } = await (await db()).execute({
    sql: `UPDATE participants SET name = ?, name_key = ?
      WHERE id = ? AND event_id = ?
        AND NOT EXISTS (SELECT 1 FROM participants WHERE event_id = ? AND name_key = ? AND id != ?)
      RETURNING id`,
    args: [clean, key, participantId, eventId, eventId, key, participantId],
  });
  return rows.length > 0;
}
