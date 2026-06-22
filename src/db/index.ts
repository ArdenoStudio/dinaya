import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type Db = PostgresJsDatabase<typeof schema>;

// ── Primary database (Supabase) — all writes and default reads ──────────
let _db: Db | null = null;

function getDb(): Db {
  if (!_db) {
    const client = postgres(process.env.DATABASE_URL!, { prepare: false });
    _db = drizzle(client, { schema });
  }
  return _db;
}

export const db: Db = new Proxy({} as Db, {
  get(_, prop: string | symbol) {
    return getDb()[prop as keyof Db];
  },
});

// ── Read replica (Neon) — opt-in for read-heavy queries ─────────────────
// Falls back to the primary DB when DATABASE_URL_READ is not set.
let _readDb: Db | null = null;

function getReadDb(): Db {
  if (!_readDb) {
    const readUrl = process.env.DATABASE_URL_READ;
    if (readUrl) {
      const client = postgres(readUrl, { prepare: false });
      _readDb = drizzle(client, { schema });
    } else {
      _readDb = getDb();
    }
  }
  return _readDb;
}

export const readDb: Db = new Proxy({} as Db, {
  get(_, prop: string | symbol) {
    return getReadDb()[prop as keyof Db];
  },
});
