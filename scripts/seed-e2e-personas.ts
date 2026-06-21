/**
 * Seed N E2E personas (default 800) with mixed plans and bookable availability.
 *
 * Usage:
 *   npx tsx scripts/seed-e2e-personas.ts
 *   npx tsx scripts/seed-e2e-personas.ts --count 800
 *   npx tsx scripts/seed-e2e-personas.ts --clean
 *   npx tsx scripts/seed-e2e-personas.ts --from 400 --count 400
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { businesses } from "../src/db/schema";
import {
  PERSONA_SLUG_PREFIX,
  deletePersonasBySlugPrefix,
  personaSlug,
  seedPersona,
  type PersonaRecord,
} from "./lib/persona-seed-core";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const FIXTURE_PATH = path.join(process.cwd(), "e2e/fixtures/personas.json");
const CONCURRENCY = 25;

function parseArgs() {
  const args = process.argv.slice(2);
  let count = 800;
  let from = 0;
  let clean = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--count" && args[i + 1]) count = Number(args[++i]);
    else if (args[i] === "--from" && args[i + 1]) from = Number(args[++i]);
    else if (args[i] === "--clean") clean = true;
  }

  return { count, from, clean };
}

async function personaExists(index: number): Promise<boolean> {
  const slug = personaSlug(index);
  const [row] = await db
    .select({ id: businesses.id })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);
  return Boolean(row);
}

async function seedRange(from: number, count: number): Promise<PersonaRecord[]> {
  const created: PersonaRecord[] = [];
  const indices = Array.from({ length: count }, (_, i) => from + i);

  for (let offset = 0; offset < indices.length; offset += CONCURRENCY) {
    const chunk = indices.slice(offset, offset + CONCURRENCY);
    const results = await Promise.all(
      chunk.map(async (index) => {
        if (await personaExists(index)) {
          console.log(`skip ${personaSlug(index)} (exists)`);
          return null;
        }
        const persona = await seedPersona(index);
        console.log(`seeded ${persona.slug} (${persona.plan})`);
        return persona;
      }),
    );
    created.push(...results.filter((row): row is PersonaRecord => row !== null));
  }

  return created;
}

async function loadExistingManifest(): Promise<PersonaRecord[]> {
  if (!fs.existsSync(FIXTURE_PATH)) return [];
  const raw = JSON.parse(fs.readFileSync(FIXTURE_PATH, "utf8")) as
    | PersonaRecord[]
    | { personas: PersonaRecord[] };
  return Array.isArray(raw) ? raw : raw.personas ?? [];
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const { count, from, clean } = parseArgs();

  if (clean) {
    const removed = await deletePersonasBySlugPrefix();
    console.log(`Removed ${removed} personas with prefix ${PERSONA_SLUG_PREFIX}`);
    if (fs.existsSync(FIXTURE_PATH)) fs.unlinkSync(FIXTURE_PATH);
    if (!count) return;
  }

  const existing = await loadExistingManifest();
  const seeded = await seedRange(from, count);
  const merged = [...existing.filter((p) => p.index < from || p.index >= from + count), ...seeded].sort(
    (a, b) => a.index - b.index,
  );

  fs.mkdirSync(path.dirname(FIXTURE_PATH), { recursive: true });
  fs.writeFileSync(FIXTURE_PATH, JSON.stringify({ personas: merged, seededAt: new Date().toISOString() }, null, 2));

  console.log(`\nDone — ${seeded.length} new personas (${merged.length} total in manifest).`);
  console.log(`Manifest: ${FIXTURE_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
