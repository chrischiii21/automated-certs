/**
 * One-time copy of events from the old Supabase project into Turso + Vercel Blob.
 * Event IDs are kept, so claim links that were already shared keep working.
 *
 * Usage (reads .env.local automatically):
 *   bun scripts/migrate-from-supabase.ts
 *
 * Needs: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY),
 *        TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, BLOB_READ_WRITE_TOKEN
 * Safe to re-run: events that already exist in Turso are skipped.
 */
import { createClient } from '@libsql/client';
import { put } from '@vercel/blob';
import { applySchema } from '../src/lib/schema';

interface SupabaseEvent {
  id: string;
  name: string;
  template_url: string;
  hotspot_x: number;
  hotspot_y: number;
  font_family: string;
  font_size: number;
  font_color: string;
  status: string;
  created_at: string;
}

const KNOWN_FONTS = ['Plus Jakarta Sans', 'Poppins', 'Playfair Display', 'Montserrat'];

function env(...names: string[]): string {
  for (const n of names) if (process.env[n]) return process.env[n]!;
  throw new Error(`Missing environment variable: ${names.join(' or ')}`);
}

async function main() {
  const supabaseUrl = env('SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_URL').replace(/\/$/, '');
  const supabaseKey = env('SUPABASE_ANON_KEY', 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  const turso = createClient({ url: env('TURSO_DATABASE_URL'), authToken: process.env.TURSO_AUTH_TOKEN });
  env('BLOB_READ_WRITE_TOKEN');

  await applySchema(turso);

  const res = await fetch(`${supabaseUrl}/rest/v1/events?select=*&order=created_at.asc`, {
    headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
  });
  if (!res.ok) throw new Error(`Supabase responded ${res.status}: ${await res.text()}`);
  const events = (await res.json()) as SupabaseEvent[];
  console.log(`Found ${events.length} event(s) in Supabase.`);

  let copied = 0;
  for (const e of events) {
    const exists = await turso.execute({ sql: 'SELECT 1 FROM events WHERE id = ?', args: [e.id] });
    if (exists.rows.length) {
      console.log(`  skip   ${e.name} (already in Turso)`);
      continue;
    }

    const image = await fetch(e.template_url);
    if (!image.ok) {
      console.warn(`  FAIL   ${e.name}: template download returned ${image.status}`);
      continue;
    }
    const ext = new URL(e.template_url).pathname.split('.').pop() || 'png';
    const blob = await put(`templates/migrated-${e.id}.${ext}`, await image.arrayBuffer(), {
      access: 'public',
      addRandomSuffix: true,
      contentType: image.headers.get('content-type') ?? undefined,
    });

    await turso.execute({
      sql: `INSERT INTO events (id, name, template_url, hotspot_x, hotspot_y, font_family, font_weight,
              font_size, font_color, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, 700, ?, ?, ?, ?)`,
      args: [
        e.id,
        e.name,
        blob.url,
        e.hotspot_x,
        e.hotspot_y,
        KNOWN_FONTS.includes(e.font_family) ? e.font_family : 'Playfair Display',
        e.font_size,
        /^#[0-9a-f]{6}$/i.test(e.font_color) ? e.font_color : '#1c1b18',
        // Old "Active" events had no participant list, so they start as drafts until one is imported.
        'draft',
        new Date(e.created_at).toISOString(),
      ],
    });
    copied++;
    console.log(`  copied ${e.name}`);
  }

  console.log(`\nDone. Copied ${copied} event(s). Import each event's participant list, then open claiming.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
