// Applies pending raw-SQL migrations and records them in a `_sql_migrations`
// table.  Supports both postgres-js (Supabase / any standard PG) and Neon HTTP
// drivers — auto-detected from the DATABASE_URL hostname.
//
// Replaces `drizzle-kit migrate`, which CANNOT run on this project: migrations
// are hand-written SQL with no drizzle journal, and drizzle-kit connects via
// Neon's websocket driver, which won't connect from plain Node (it just hangs
// and exits 1 — which is how local DBs silently drifted).
//
// Behaviour:
//   • Discovers drizzle/*.sql in lexicographic order (= numeric prefix, with the
//     documented duplicate-sequence pairs ordered by filename — see
//     MIGRATION_LEDGER.md).
//   • First run on an already-provisioned DB (the `businesses` table exists):
//     baselines every existing migration as already-applied — it does NOT
//     re-run history.
//   • First run on a fresh/empty DB: applies every migration in order.
//   • Thereafter: applies only files not yet recorded, in order.
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { sql as raw } from "drizzle-orm";

const MIGRATIONS_DIR = "drizzle";
const TABLE = "_sql_migrations";
const SENTINEL_TABLE = "businesses";
const FILENAME_RE = /^[0-9A-Za-z._-]+$/;

const url = process.env.DATABASE_URL_DIRECT ?? process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL_DIRECT / DATABASE_URL is not set (looked in .env.local / .env).");
  process.exit(1);
}

const isNeon = url.includes("neon.tech");

let db;
let close = async () => {};
if (isNeon) {
  const { neon } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-http");
  db = drizzle(neon(url));
} else {
  const pg = (await import("postgres")).default;
  const { drizzle } = await import("drizzle-orm/postgres-js");
  const client = pg(url, { prepare: false });
  db = drizzle(client);
  close = () => client.end({ timeout: 5 });
}

async function run(text) {
  const res = await db.execute(raw.raw(text));
  return res.rows ?? res;
}

async function tableExists(name) {
  const rows = await run(`SELECT to_regclass('public.${name}') AS reg`);
  return rows[0]?.reg != null;
}

/**
 * Split a SQL file into statements on `;`, while respecting dollar-quoted
 * blocks ($$ … $$ / $tag$ … $tag$), single-quoted strings, and -- / block
 * comments (so semicolons inside DO blocks and functions aren't mis-split).
 */
function splitStatements(sqlText) {
  const out = [];
  let buf = "";
  let dollar = null;
  let inLine = false;
  let inBlock = false;
  let inStr = false;
  for (let i = 0; i < sqlText.length; i++) {
    const ch = sqlText[i];
    const two = sqlText.slice(i, i + 2);
    if (inLine) {
      if (ch === "\n") { inLine = false; buf += ch; }
      continue;
    }
    if (inBlock) {
      if (two === "*/") { inBlock = false; i++; }
      continue;
    }
    if (dollar) {
      if (sqlText.startsWith(dollar, i)) { buf += dollar; i += dollar.length - 1; dollar = null; }
      else buf += ch;
      continue;
    }
    if (inStr) {
      buf += ch;
      if (ch === "'") inStr = false;
      continue;
    }
    if (two === "--") { inLine = true; i++; continue; }
    if (two === "/*") { inBlock = true; i++; continue; }
    if (ch === "'") { inStr = true; buf += ch; continue; }
    if (ch === "$") {
      const m = sqlText.slice(i).match(/^\$[A-Za-z_]*\$/);
      if (m) { dollar = m[0]; buf += m[0]; i += m[0].length - 1; continue; }
    }
    if (ch === ";") { const s = buf.trim(); if (s) out.push(s); buf = ""; continue; }
    buf += ch;
  }
  const tail = buf.trim();
  if (tail) out.push(tail);
  return out;
}

async function main() {
  console.log(`Using ${isNeon ? "Neon HTTP" : "postgres-js"} driver`);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const f of files) {
    if (!FILENAME_RE.test(f)) throw new Error(`Unsafe migration filename: ${f}`);
  }

  const trackerExisted = await tableExists(TABLE);
  await run(
    `CREATE TABLE IF NOT EXISTS "${TABLE}" ("name" text PRIMARY KEY, "applied_at" timestamptz NOT NULL DEFAULT now())`,
  );

  if (!trackerExisted && (await tableExists(SENTINEL_TABLE))) {
    for (const f of files) {
      await run(`INSERT INTO "${TABLE}" ("name") VALUES ('${f}') ON CONFLICT DO NOTHING`);
    }
    console.log(`Adopted existing database — baselined ${files.length} migrations as already-applied.`);
  }

  const appliedRows = await run(`SELECT name FROM "${TABLE}"`);
  const applied = new Set(appliedRows.map((r) => r.name));
  const pending = files.filter((f) => !applied.has(f));

  if (pending.length === 0) {
    console.log("✅ Database is up to date — no pending migrations.");
    return;
  }

  console.log(`Applying ${pending.length} pending migration(s):`);
  for (const file of pending) {
    const statements = splitStatements(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
    for (const stmt of statements) await run(stmt);
    await run(`INSERT INTO "${TABLE}" ("name") VALUES ('${file}') ON CONFLICT DO NOTHING`);
    console.log(`  ✓ ${file} (${statements.length} statement${statements.length === 1 ? "" : "s"})`);
  }
  console.log("✅ Migrations applied.");
}

try {
  await main();
} catch (err) {
  console.error("Migration failed:", err?.message ?? err);
  process.exitCode = 1;
} finally {
  await close();
}
