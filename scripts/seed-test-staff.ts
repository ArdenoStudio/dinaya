/**
 * Adds extra stylists to the test business so staff selection appears in booking QA.
 *
 * Usage:
 *   npx tsx scripts/seed-test-staff.ts
 *   npx tsx scripts/seed-test-staff.ts my-slug
 */
import { randomUUID } from "node:crypto";
import * as dotenv from "dotenv";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import {
  availability,
  businesses,
  locations,
  services,
  staff,
  staffLocations,
  staffServices,
} from "../src/db/schema";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const DEFAULT_DAYS = [0, 1, 2, 3, 4, 5, 6];

const EXTRA_STAFF = [
  { name: "Priya", bio: "Colour specialist — cuts, balayage, and event styling." },
  { name: "Kamal", bio: "Barber — fades, beard sculpts, and classic cuts." },
] as const;

async function ensureAvailability(staffId: string) {
  const existing = await db
    .select({ dayOfWeek: availability.dayOfWeek })
    .from(availability)
    .where(eq(availability.staffId, staffId));

  const have = new Set(existing.map((row) => row.dayOfWeek));
  const missing = DEFAULT_DAYS.filter((day) => !have.has(day));

  if (missing.length > 0) {
    await db.insert(availability).values(
      missing.map((dayOfWeek) => ({
        staffId,
        dayOfWeek,
        startTime: "09:00",
        endTime: "17:00",
      })),
    );
  }
}

async function main() {
  const slug = process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "test";

  const [business] = await db
    .select({ id: businesses.id, name: businesses.name, slug: businesses.slug })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business) {
    console.error(`No business found with slug "${slug}"`);
    process.exit(1);
  }

  const [defaultLocation] = await db
    .select({ id: locations.id })
    .from(locations)
    .where(and(eq(locations.businessId, business.id), eq(locations.isActive, true)))
    .limit(1);

  const activeServices = await db
    .select({ id: services.id, name: services.name })
    .from(services)
    .where(and(eq(services.businessId, business.id), eq(services.isActive, true)));

  if (activeServices.length === 0) {
    console.error(`No active services for "${slug}" — run seed-test-services.ts first`);
    process.exit(1);
  }

  const existingStaff = await db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .where(and(eq(staff.businessId, business.id), eq(staff.isActive, true)));

  const existingNames = new Set(existingStaff.map((row) => row.name.toLowerCase()));
  let added = 0;

  for (const member of EXTRA_STAFF) {
    if (existingNames.has(member.name.toLowerCase())) {
      console.log(`= ${member.name} (already present)`);
      continue;
    }

    const staffId = randomUUID();
    await db.insert(staff).values({
      id: staffId,
      businessId: business.id,
      name: member.name,
      bio: member.bio,
      isActive: true,
    });

    await db.insert(staffServices).values(
      activeServices.map((service) => ({
        staffId,
        serviceId: service.id,
      })),
    );

    if (defaultLocation) {
      await db.insert(staffLocations).values({
        staffId,
        locationId: defaultLocation.id,
        isPrimary: false,
      });
    }

    await ensureAvailability(staffId);
    existingNames.add(member.name.toLowerCase());
    added += 1;
    console.log(`+ ${member.name}`);
  }

  for (const member of existingStaff) {
    await ensureAvailability(member.id);
  }

  const totalStaff = existingStaff.length + added;
  console.log(
    `\nDone — ${business.name} (${business.slug}): added ${added} stylists. Active staff: ${totalStaff}.`,
  );
  console.log("Open the booking page and pick a haircut to see the stylist step.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
