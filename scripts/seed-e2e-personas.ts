/**
 * Seed N E2E personas (default 800) with mixed plans and bookable availability.
 *
 * Usage:
 *   npx tsx scripts/seed-e2e-personas.ts
 *   npx tsx scripts/seed-e2e-personas.ts --count 800
 *   npx tsx scripts/seed-e2e-personas.ts --clean
 *   npx tsx scripts/seed-e2e-personas.ts --from 400 --count 400
 *   npx tsx scripts/seed-e2e-personas.ts --enrich-rich
 */
import * as fs from "node:fs";
import * as path from "node:path";
import * as dotenv from "dotenv";
import { eq, like } from "drizzle-orm";
import { db } from "../src/db";
import { businesses, clients, reviews } from "../src/db/schema";
import {
  PERSONA_SLUG_PREFIX,
  deletePersonasBySlugPrefix,
  enrichRichPersona,
  isRichPersonaIndex,
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
  let count: number | null = 800;
  let from = 0;
  let clean = false;
  let enrichRich = false;
  let countSet = false;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--count" && args[i + 1]) {
      count = Number(args[++i]);
      countSet = true;
    } else if (args[i] === "--from" && args[i + 1]) from = Number(args[++i]);
    else if (args[i] === "--clean") clean = true;
    else if (args[i] === "--enrich-rich") enrichRich = true;
  }

  if (enrichRich && !countSet) count = 0;

  return { count: count ?? 0, from, clean, enrichRich };
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

async function enrichExistingRichPersonas(manifest: PersonaRecord[]): Promise<number> {
  const richRows = await db
    .select({
      businessId: businesses.id,
      slug: businesses.slug,
      onboardingCompletedAt: businesses.onboardingCompletedAt,
    })
    .from(businesses)
    .where(like(businesses.slug, `${PERSONA_SLUG_PREFIX}%`));

  let enriched = 0;
  for (const row of richRows) {
    const index = Number.parseInt(row.slug.replace(PERSONA_SLUG_PREFIX, ""), 10);
    if (Number.isNaN(index) || !isRichPersonaIndex(index)) continue;

    const manifestRow = manifest.find((p) => p.index === index);
    if (!manifestRow) continue;
    if (manifestRow.rich && manifestRow.clientId && manifestRow.reviewId) continue;
    if (row.onboardingCompletedAt) {
      const [client] = await db
        .select({ id: clients.id })
        .from(clients)
        .where(eq(clients.businessId, row.businessId))
        .limit(1);
      const [review] = await db
        .select({ id: reviews.id })
        .from(reviews)
        .where(eq(reviews.businessId, row.businessId))
        .limit(1);
      if (client && review) {
        manifestRow.rich = true;
        manifestRow.clientId = client.id;
        manifestRow.reviewId = review.id;
        continue;
      }
    }

    const updated = await enrichRichPersona(manifestRow);
    Object.assign(manifestRow, updated);
    enriched++;
    console.log(`enriched ${row.slug}`);
  }

  return enriched;
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

  const { count, from, clean, enrichRich } = parseArgs();

  if (clean) {
    const removed = await deletePersonasBySlugPrefix();
    console.log(`Removed ${removed} personas with prefix ${PERSONA_SLUG_PREFIX}`);
    if (fs.existsSync(FIXTURE_PATH)) fs.unlinkSync(FIXTURE_PATH);
    if (!count && !enrichRich) return;
  }

  const existing = await loadExistingManifest();
  const seeded = await seedRange(from, count);
  const merged = [...existing.filter((p) => p.index < from || p.index >= from + count), ...seeded].sort(
    (a, b) => a.index - b.index,
  );

  const enrichedCount = enrichRich ? await enrichExistingRichPersonas(merged) : 0;

  fs.mkdirSync(path.dirname(FIXTURE_PATH), { recursive: true });
  fs.writeFileSync(
    FIXTURE_PATH,
    JSON.stringify(
      {
        personas: merged,
        seededAt: new Date().toISOString(),
        ...(enrichRich ? { enrichedRich: enrichedCount } : {}),
      },
      null,
      2,
    ),
  );

  console.log(`\nDone — ${seeded.length} new personas (${merged.length} total in manifest).`);
  if (enrichRich) console.log(`Enriched ${enrichedCount} rich personas.`);
  console.log(`Manifest: ${FIXTURE_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
