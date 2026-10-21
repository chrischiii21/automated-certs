// Shared by the app (applied lazily on first DB use) and scripts/.
// Every statement must be idempotent.

const NOW = `(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    template_url TEXT NOT NULL,
    hotspot_x REAL NOT NULL DEFAULT 50,
    hotspot_y REAL NOT NULL DEFAULT 50,
    max_width REAL NOT NULL DEFAULT 80,
    font_family TEXT NOT NULL DEFAULT 'Playfair Display',
    font_weight INTEGER NOT NULL DEFAULT 700,
    font_size INTEGER NOT NULL DEFAULT 64,
    font_color TEXT NOT NULL DEFAULT '#1c1b18',
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
    created_at TEXT NOT NULL DEFAULT ${NOW},
    updated_at TEXT NOT NULL DEFAULT ${NOW}
  )`,
  `CREATE TABLE IF NOT EXISTS participants (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    name_key TEXT NOT NULL,
    claim_count INTEGER NOT NULL DEFAULT 0,
    first_claimed_at TEXT,
    last_claimed_at TEXT,
    created_at TEXT NOT NULL DEFAULT ${NOW},
    UNIQUE (event_id, name_key)
  )`,
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL DEFAULT ${NOW}
  )`,
  // Magic-link tokens. Only a hash is stored; guest_id lets a guest's work move into the new account.
  `CREATE TABLE IF NOT EXISTS login_tokens (
    token_hash TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    guest_id TEXT,
    expires_at TEXT NOT NULL,
    used_at TEXT,
    created_at TEXT NOT NULL DEFAULT ${NOW}
  )`,
  `CREATE INDEX IF NOT EXISTS login_tokens_email ON login_tokens (email, created_at)`,
  // Failed password attempts, for locking out repeated guessing.
  `CREATE TABLE IF NOT EXISTS login_failures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL,
    ip TEXT,
    created_at TEXT NOT NULL DEFAULT ${NOW}
  )`,
  `CREATE INDEX IF NOT EXISTS login_failures_email ON login_failures (email, created_at)`,
  `CREATE INDEX IF NOT EXISTS login_failures_ip ON login_failures (ip, created_at)`,
];

/** Columns added after the first release. SQLite has no ADD COLUMN IF NOT EXISTS, so check first. */
const ADDED_COLUMNS: { table: string; column: string; definition: string }[] = [
  { table: 'events', column: 'logo_url', definition: 'TEXT' },
  { table: 'events', column: 'organizer', definition: 'TEXT' },
  // A user id, or 'guest:<id>' for events made before signing up. NULL = created before accounts existed.
  { table: 'events', column: 'owner_id', definition: 'TEXT' },
  // Profile collected on first sign-in.
  { table: 'users', column: 'name', definition: 'TEXT' },
  { table: 'users', column: 'account_type', definition: 'TEXT' }, // 'individual' | 'organization'
  { table: 'users', column: 'organization', definition: 'TEXT' },
  { table: 'users', column: 'use_case', definition: 'TEXT' },
  { table: 'users', column: 'onboarded_at', definition: 'TEXT' },
  { table: 'users', column: 'password_hash', definition: 'TEXT' },
  { table: 'users', column: 'email_verified_at', definition: 'TEXT' },
  // What an emailed link is for: 'verify' (confirm a new account) or 'reset' (set a new password).
  { table: 'login_tokens', column: 'purpose', definition: "TEXT NOT NULL DEFAULT 'verify'" },
];

interface SchemaClient {
  batch(stmts: string[], mode: 'write'): Promise<unknown>;
  execute(sql: string): Promise<{ rows: ArrayLike<Record<string, unknown>> }>;
}

export async function applySchema(client: SchemaClient) {
  await client.batch(SCHEMA, 'write');
  for (const { table, column, definition } of ADDED_COLUMNS) {
    const { rows } = await client.execute(`PRAGMA table_info(${table})`);
    if (!Array.from(rows).some((r) => r.name === column)) {
      await client.execute(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
    }
  }
  await client.execute('CREATE INDEX IF NOT EXISTS events_owner ON events (owner_id)');
}
