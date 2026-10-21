import 'server-only';
import { createClient, type Client } from '@libsql/client';
import { applySchema } from './schema';

let client: Client | undefined;
let ready: Promise<unknown> | undefined;

/**
 * Turso client. Without TURSO_DATABASE_URL it falls back to a local
 * SQLite file so the app can run in development with zero setup.
 */
export async function db(): Promise<Client> {
  if (!client) {
    client = createClient({
      url: process.env.TURSO_DATABASE_URL || 'file:local.db',
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  ready ??= applySchema(client).catch((err) => {
    ready = undefined;
    throw err;
  });
  await ready;
  return client;
}
