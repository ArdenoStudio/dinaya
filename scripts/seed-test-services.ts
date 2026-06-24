/**
 * Adds salon-style services (default 30) to the test business for hub/list QA.
 *
 * Usage:
 *   npx tsx scripts/seed-test-services.ts
 *   npx tsx scripts/seed-test-services.ts my-slug
 *   npx tsx scripts/seed-test-services.ts test --count 30
 */
import { randomUUID } from "node:crypto";
import * as dotenv from "dotenv";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  businesses,
  serviceCategories,
  services,
  staff,
  staffServices,
} from "../src/db/schema";
import { allocateServiceSlug } from "../src/lib/service-slug";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

type SeedService = {
  name: string;
  category: string;
  durationMinutes: number;
  priceLkr: number;
  description: string;
};

const CATALOG: SeedService[] = [
  { category: "Haircuts", name: "Kids haircut", durationMinutes: 25, priceLkr: 1200, description: "Cut and style for children under 12." },
  { category: "Haircuts", name: "Senior haircut", durationMinutes: 30, priceLkr: 1300, description: "Classic cut with wash and finish." },
  { category: "Haircuts", name: "Buzz cut", durationMinutes: 20, priceLkr: 1000, description: "Single-length clipper cut." },
  { category: "Haircuts", name: "Layer cut", durationMinutes: 45, priceLkr: 2200, description: "Layered shape with styling." },
  { category: "Haircuts", name: "Fringe trim", durationMinutes: 15, priceLkr: 800, description: "Quick fringe tidy between cuts." },
  { category: "Colour", name: "Full colour", durationMinutes: 90, priceLkr: 8500, description: "All-over permanent or demi colour." },
  { category: "Colour", name: "Root touch-up", durationMinutes: 60, priceLkr: 5500, description: "Regrowth colour refresh." },
  { category: "Colour", name: "Highlights (foils)", durationMinutes: 120, priceLkr: 12000, description: "Partial or full foil highlights." },
  { category: "Colour", name: "Balayage", durationMinutes: 150, priceLkr: 14500, description: "Hand-painted lightening blend." },
  { category: "Colour", name: "Toner refresh", durationMinutes: 45, priceLkr: 3500, description: "Gloss or toner to revive tone." },
  { category: "Grooming", name: "Beard sculpt", durationMinutes: 30, priceLkr: 1800, description: "Shape, line, and hot towel finish." },
  { category: "Grooming", name: "Hot towel shave", durationMinutes: 35, priceLkr: 2200, description: "Traditional straight-razor shave." },
  { category: "Grooming", name: "Beard colour", durationMinutes: 40, priceLkr: 2800, description: "Blend grey or refresh beard tone." },
  { category: "Grooming", name: "Mustache trim", durationMinutes: 15, priceLkr: 700, description: "Shape and tidy mustache." },
  { category: "Treatments", name: "Deep conditioning", durationMinutes: 30, priceLkr: 2500, description: "Intensive moisture mask treatment." },
  { category: "Treatments", name: "Keratin smoothing", durationMinutes: 120, priceLkr: 18000, description: "Frizz-reducing keratin treatment." },
  { category: "Treatments", name: "Scalp treatment", durationMinutes: 40, priceLkr: 3200, description: "Exfoliate and nourish the scalp." },
  { category: "Treatments", name: "Hair spa", durationMinutes: 50, priceLkr: 4500, description: "Relaxing cleanse, massage, and mask." },
  { category: "Styling", name: "Blow dry", durationMinutes: 30, priceLkr: 2000, description: "Wash and blow-dry styling." },
  { category: "Styling", name: "Event updo", durationMinutes: 60, priceLkr: 6500, description: "Formal updo for weddings and events." },
  { category: "Styling", name: "Hair wash", durationMinutes: 20, priceLkr: 1200, description: "Shampoo and condition with scalp massage." },
  { category: "Styling", name: "Straightening session", durationMinutes: 45, priceLkr: 2800, description: "Flat iron finish for sleek hair." },
  { category: "Styling", name: "Curls & waves", durationMinutes: 45, priceLkr: 2800, description: "Iron or wand styling for texture." },
  { category: "Consultations", name: "Colour consultation", durationMinutes: 20, priceLkr: 0, description: "Discuss colour goals before booking." },
  { category: "Consultations", name: "Bridal trial", durationMinutes: 90, priceLkr: 7500, description: "Wedding hair trial with style notes." },
  { category: "Haircuts", name: "Men's classic cut", durationMinutes: 35, priceLkr: 1500, description: "Scissor or clipper cut with wash and style." },
  { category: "Colour", name: "Ombre colour", durationMinutes: 120, priceLkr: 11000, description: "Gradual light-to-dark or dark-to-light blend." },
  { category: "Treatments", name: "Perm & set", durationMinutes: 90, priceLkr: 9500, description: "Body wave or curl perm with neutralising finish." },
  { category: "Grooming", name: "Eyebrow shaping", durationMinutes: 15, priceLkr: 900, description: "Thread or wax tidy for brows." },
  { category: "Styling", name: "Express blow dry", durationMinutes: 20, priceLkr: 1500, description: "Quick wash and blow-dry for everyday polish." },
];

function parseCount(argv: string[]): number {
  const idx = argv.indexOf("--count");
  if (idx === -1) return CATALOG.length;
  const value = Number(argv[idx + 1]);
  return Number.isFinite(value) && value > 0 ? Math.min(value, CATALOG.length) : CATALOG.length;
}

async function ensureCategory(
  businessId: string,
  name: string,
  sortOrder: number,
  cache: Map<string, string>,
): Promise<string> {
  const cached = cache.get(name);
  if (cached) return cached;

  const [existing] = await db
    .select({ id: serviceCategories.id })
    .from(serviceCategories)
    .where(and(eq(serviceCategories.businessId, businessId), eq(serviceCategories.name, name)))
    .limit(1);

  if (existing) {
    cache.set(name, existing.id);
    return existing.id;
  }

  const id = randomUUID();
  await db.insert(serviceCategories).values({
    id,
    businessId,
    name,
    sortOrder,
  });
  cache.set(name, id);
  return id;
}

async function main() {
  const args = process.argv.slice(2);
  const slug = args.find((arg) => !arg.startsWith("--")) ?? "test";
  const count = parseCount(args);
  const toSeed = CATALOG.slice(0, count);

  const [business] = await db
    .select({ id: businesses.id, name: businesses.name, slug: businesses.slug })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business) {
    console.error(`No business found with slug "${slug}"`);
    process.exit(1);
  }

  const members = await db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .where(and(eq(staff.businessId, business.id), eq(staff.isActive, true)));

  if (members.length === 0) {
    console.error(`No active staff for "${slug}"`);
    process.exit(1);
  }

  const existing = await db
    .select({ name: services.name })
    .from(services)
    .where(eq(services.businessId, business.id));

  const existingNames = new Set(existing.map((row) => row.name.toLowerCase()));
  const categoryCache = new Map<string, string>();
  const categoryOrder = [...new Set(toSeed.map((item) => item.category))];

  let added = 0;
  let skipped = 0;

  for (const item of toSeed) {
    if (existingNames.has(item.name.toLowerCase())) {
      skipped += 1;
      continue;
    }

    const categoryId = await ensureCategory(
      business.id,
      item.category,
      categoryOrder.indexOf(item.category),
      categoryCache,
    );
    const serviceId = randomUUID();
    const serviceSlug = await allocateServiceSlug(business.id, item.name);

    await db.insert(services).values({
      id: serviceId,
      businessId: business.id,
      categoryId,
      name: item.name,
      slug: serviceSlug,
      description: item.description,
      durationMinutes: item.durationMinutes,
      priceLkr: item.priceLkr,
      requiresPayment: false,
      depositPercent: 0,
      minimumNoticeHours: 0,
      isActive: true,
    });

    await db.insert(staffServices).values(
      members.map((member) => ({
        staffId: member.id,
        serviceId,
      })),
    );

    existingNames.add(item.name.toLowerCase());
    added += 1;
    console.log(`+ ${item.name} (${item.category})`);
  }

  console.log(
    `\nDone — ${business.name} (${business.slug}): added ${added}, skipped ${skipped} (already present). Active services: ${existing.length + added}.`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
