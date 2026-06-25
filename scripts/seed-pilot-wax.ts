/**
 * Seeds the Wax in the City pilot booking site: account, categories, services,
 * availability, and business profile.
 *
 * Usage:
 *   npx tsx scripts/seed-pilot-wax.ts
 *   npx tsx scripts/seed-pilot-wax.ts --slug wax-in-the-city
 *
 * Optional env (defaults shown):
 *   WAX_OWNER_NAME="Studio Manager"
 *   WAX_OWNER_EMAIL="owner@waxinthecity.lk"
 *   WAX_OWNER_PASSWORD="WaxPilot2026!"
 */
import { randomUUID } from "node:crypto";
import { addDays } from "date-fns";
import * as dotenv from "dotenv";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "../src/db";
import {
  availability,
  businesses,
  serviceCategories,
  services,
  staff,
  staffServices,
} from "../src/db/schema";
import { registerBusinessAccount } from "../src/lib/auth/register-business-account";
import { allocateServiceSlug } from "../src/lib/service-slug";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const DEFAULT_SLUG = "wax-in-the-city";
const BUSINESS_NAME = "Wax in the City";

/** Served from public/demo/ — Wax In The City SL Facebook profile logo. */
export const WAX_LOGO_PATH = "/demo/wax-in-the-city-logo.webp";
export const WAX_BANNER_PATH = "/demo/wax-in-the-city-banner.webp";
/** Pink from the Wax in the City brand mark (logo background). */
export const WAX_ACCENT_COLOR = "#ff6699";
/** Soft blush page background — pairs with the salon preset. */
export const WAX_PAGE_BACKGROUND_COLOR = "#fff6f8";

const BUSINESS_DESCRIPTION =
  "Ladies waxing and beauty studio in Colombo — root-clean hair removal, facials, Moroccan rituals, and HydraFacial treatments. Book online and pay your balance at the salon.";

const CANCELLATION_POLICY =
  "Please give us at least 24 hours notice if you need to cancel or reschedule. Late cancellations may forfeit any deposit paid.";

const DEPOSIT_POLICY =
  "A deposit may be required on premium services (Brazilian wax, full body wax, HydraFacial MD). Deposits are credited toward your visit.";

type SeedService = {
  name: string;
  category: string;
  durationMinutes: number;
  durationLabel: string;
  priceLkr: number;
  description: string;
  depositPercent?: number;
};

const CATALOG: SeedService[] = [
  // Waxing — root-clean hair removal
  {
    category: "Waxing",
    name: "Full Body Wax",
    durationMinutes: 75,
    durationLabel: "60–75 min",
    priceLkr: 6500,
    description: "Root-clean hair removal from head to toe. Allow 60–75 minutes.",
    depositPercent: 25,
  },
  {
    category: "Waxing",
    name: "Brazilian Wax",
    durationMinutes: 40,
    durationLabel: "30–40 min",
    priceLkr: 3500,
    description: "Professional Brazilian wax with gentle, root-clean removal. Allow 30–40 minutes.",
    depositPercent: 25,
  },
  {
    category: "Waxing",
    name: "Half Leg Wax",
    durationMinutes: 30,
    durationLabel: "25–30 min",
    priceLkr: 1800,
    description: "Lower or upper leg wax for smooth, lasting results. Allow 25–30 minutes.",
  },
  {
    category: "Waxing",
    name: "Half Arm Wax",
    durationMinutes: 25,
    durationLabel: "20–25 min",
    priceLkr: 1500,
    description: "Lower or upper arm wax. Allow 20–25 minutes.",
  },
  {
    category: "Waxing",
    name: "Underarm Wax",
    durationMinutes: 15,
    durationLabel: "15 min",
    priceLkr: 900,
    description: "Quick underarm wax for clean, smooth skin.",
  },
  {
    category: "Waxing",
    name: "Eyebrow Wax",
    durationMinutes: 15,
    durationLabel: "15 min",
    priceLkr: 800,
    description: "Shape and define brows with precise waxing.",
  },
  {
    category: "Waxing",
    name: "Lip Wax",
    durationMinutes: 10,
    durationLabel: "10 min",
    priceLkr: 800,
    description: "Upper lip wax for a clean, smooth finish.",
  },
  // Facials
  {
    category: "Facials",
    name: "Classic Facial",
    durationMinutes: 45,
    durationLabel: "45 min",
    priceLkr: 3500,
    description: "Calm skin work for glow, texture, and everyday maintenance.",
  },
  {
    category: "Facials",
    name: "Deep Cleanse Facial",
    durationMinutes: 60,
    durationLabel: "60 min",
    priceLkr: 4500,
    description: "Thorough cleanse and extraction for congested or oily skin.",
  },
  {
    category: "Facials",
    name: "Brightening Facial",
    durationMinutes: 60,
    durationLabel: "60 min",
    priceLkr: 5500,
    description: "Targeted brightening treatment for dull or uneven tone.",
  },
  // Moroccan
  {
    category: "Moroccan",
    name: "Moroccan Black Soap Treatment",
    durationMinutes: 60,
    durationLabel: "60 min",
    priceLkr: 4500,
    description: "Deep-clean ritual with traditional black soap and exfoliation.",
  },
  {
    category: "Moroccan",
    name: "Moroccan Clay Mask",
    durationMinutes: 45,
    durationLabel: "45 min",
    priceLkr: 4000,
    description: "Purifying clay mask ritual for refreshed, balanced skin.",
  },
  // Hydra Facial
  {
    category: "Hydra Facial",
    name: "HydraFacial MD",
    durationMinutes: 50,
    durationLabel: "50 min",
    priceLkr: 12500,
    description: "Full cleanse, extract, and hydrate — visible refresh without downtime.",
    depositPercent: 25,
  },
  {
    category: "Hydra Facial",
    name: "Express HydraFacial",
    durationMinutes: 30,
    durationLabel: "30 min",
    priceLkr: 7500,
    description: "Express cleanse, extract, and hydrate for a quick skin refresh.",
  },
];

const PRESET_NAMES_TO_REMOVE = [
  "Massage therapy",
  "Facial treatment",
  "Haircut",
  "Hair colouring consultation",
  "Beard trim",
  "Consultation",
  "Standard appointment",
];

function parseSlug(argv: string[]): string {
  const idx = argv.indexOf("--slug");
  if (idx !== -1 && argv[idx + 1]) return argv[idx + 1];
  return DEFAULT_SLUG;
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

async function ensureBusiness(slug: string): Promise<{ id: string; name: string; slug: string }> {
  const [existing] = await db
    .select({ id: businesses.id, name: businesses.name, slug: businesses.slug })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (existing) {
    console.log(`Business already exists: ${existing.name} (${existing.slug})`);
    return existing;
  }

  const ownerName = process.env.WAX_OWNER_NAME ?? "Studio Manager";
  const ownerEmail = process.env.WAX_OWNER_EMAIL ?? "owner@waxinthecity.lk";
  const ownerPassword = process.env.WAX_OWNER_PASSWORD ?? "WaxPilot2026!";

  console.log(`Creating business account for ${BUSINESS_NAME} (${slug})...`);
  const { businessId } = await registerBusinessAccount({
    name: ownerName,
    businessName: BUSINESS_NAME,
    slug,
    email: ownerEmail,
    password: ownerPassword,
    businessType: "spa_wellness",
    language: "en",
  });

  console.log(`  Owner: ${ownerEmail}`);
  console.log(`  Password: ${ownerPassword}`);

  const [created] = await db
    .select({ id: businesses.id, name: businesses.name, slug: businesses.slug })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!created) {
    throw new Error("Business was created but could not be loaded.");
  }

  return created;
}

async function updateBusinessProfile(businessId: string) {
  await db
    .update(businesses)
    .set({
      description: BUSINESS_DESCRIPTION,
      cancellationPolicy: CANCELLATION_POLICY,
      depositPolicy: DEPOSIT_POLICY,
      businessType: "spa_wellness",
      logoUrl: WAX_LOGO_PATH,
      accentColor: WAX_ACCENT_COLOR,
      bookingPageBackground: "accent",
      bookingPageBackgroundColor: null,
      bookingPanelBackground: "accent",
      bookingHeroOverlay: "brand",
      bookingHeroOverlayOpacity: 55,
      bookingThemePreset: "salon_vivid",
      galleryImages: [WAX_BANNER_PATH],
      plan: "pro",
      planExpiresAt: addDays(new Date(), 365),
      onboardingCompletedAt: new Date(),
      onboardingStep: 4,
      phone: process.env.WAX_PHONE ?? "+94770000000",
      address: process.env.WAX_ADDRESS ?? "Colombo, Sri Lanka",
    })
    .where(eq(businesses.id, businessId));
}

async function removePresetServices(businessId: string) {
  const toRemove = await db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(
      and(
        eq(services.businessId, businessId),
        inArray(services.name, PRESET_NAMES_TO_REMOVE),
      ),
    );

  if (toRemove.length === 0) return;

  const ids = toRemove.map((row) => row.id);
  await db.delete(staffServices).where(inArray(staffServices.serviceId, ids));
  await db.delete(services).where(inArray(services.id, ids));

  for (const row of toRemove) {
    console.log(`- removed preset: ${row.name}`);
  }
}

async function seedServices(businessId: string) {
  const members = await db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true)));

  if (members.length === 0) {
    throw new Error("No active staff found — cannot link services.");
  }

  const existing = await db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(eq(services.businessId, businessId));

  const existingNames = new Set(existing.map((row) => row.name.toLowerCase()));
  const categoryCache = new Map<string, string>();
  const categoryOrder = [...new Set(CATALOG.map((item) => item.category))];

  let added = 0;
  let skipped = 0;

  for (const item of CATALOG) {
    if (existingNames.has(item.name.toLowerCase())) {
      skipped += 1;
      continue;
    }

    const categoryId = await ensureCategory(
      businessId,
      item.category,
      categoryOrder.indexOf(item.category),
      categoryCache,
    );
    const serviceId = randomUUID();
    const serviceSlug = await allocateServiceSlug(businessId, item.name);
    const depositPercent = item.depositPercent ?? 0;

    await db.insert(services).values({
      id: serviceId,
      businessId,
      categoryId,
      name: item.name,
      slug: serviceSlug,
      description: item.description,
      durationMinutes: item.durationMinutes,
      priceLkr: item.priceLkr,
      requiresPayment: depositPercent > 0,
      depositPercent,
      minimumNoticeHours: 2,
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
    console.log(`+ ${item.name} (${item.category}) — ${item.durationLabel}, LKR ${item.priceLkr.toLocaleString()}`);
  }

  return { added, skipped, staffCount: members.length };
}

async function ensureAvailability(businessId: string) {
  const members = await db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true)));

  const workDays = [1, 2, 3, 4, 5, 6]; // Mon–Sat

  for (const member of members) {
    const existing = await db
      .select({ dayOfWeek: availability.dayOfWeek })
      .from(availability)
      .where(eq(availability.staffId, member.id));

    const have = new Set(existing.map((row) => row.dayOfWeek));
    const missing = workDays.filter((day) => !have.has(day));

    if (missing.length > 0) {
      await db.insert(availability).values(
        missing.map((dayOfWeek) => ({
          staffId: member.id,
          dayOfWeek,
          startTime: "09:00",
          endTime: "19:00",
        })),
      );
    }

    // Update existing Mon–Sat windows to 09:00–19:00
    await db
      .update(availability)
      .set({ startTime: "09:00", endTime: "19:00" })
      .where(
        and(
          eq(availability.staffId, member.id),
          inArray(availability.dayOfWeek, workDays),
        ),
      );

    console.log(`${member.name}: Mon–Sat 09:00–19:00`);
  }
}

async function backfillStaffLinks(businessId: string) {
  const members = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.businessId, businessId), eq(staff.isActive, true)));

  const allServices = await db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(and(eq(services.businessId, businessId), eq(services.isActive, true)));

  const catalogNames = new Set(CATALOG.map((item) => item.name.toLowerCase()));
  const existingLinks = await db
    .select({ serviceId: staffServices.serviceId })
    .from(staffServices)
    .innerJoin(services, eq(services.id, staffServices.serviceId))
    .where(eq(services.businessId, businessId));

  const linkedServiceIds = new Set(existingLinks.map((row) => row.serviceId));
  let backfilled = 0;

  for (const service of allServices) {
    if (!catalogNames.has(service.name.toLowerCase())) continue;
    if (linkedServiceIds.has(service.id)) continue;

    await db.insert(staffServices).values(
      members.map((member) => ({
        staffId: member.id,
        serviceId: service.id,
      })),
    );
    backfilled += 1;
  }

  return backfilled;
}

async function main() {
  const slug = parseSlug(process.argv.slice(2));

  const business = await ensureBusiness(slug);
  await updateBusinessProfile(business.id);
  await removePresetServices(business.id);

  const { added, skipped, staffCount } = await seedServices(business.id);
  const backfilled = await backfillStaffLinks(business.id);
  await ensureAvailability(business.id);

  const activeCount = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.businessId, business.id), eq(services.isActive, true)));

  console.log(
    `\nDone — ${business.name} (${business.slug})`,
  );
  console.log(`  Services: ${activeCount.length} active (${added} added, ${skipped} skipped)`);
  console.log(`  Staff: ${staffCount} linked`);
  if (backfilled > 0) {
    console.log(`  Backfilled ${backfilled} staff-service link(s)`);
  }
  console.log(`  Booking URL: https://${slug}.dinaya.lk`);
  console.log(`  Local: /book/${slug}`);

  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
