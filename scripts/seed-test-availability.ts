/**
 * Ensures the test business (slug: test) has bookable availability for local QA.
 *
 * Usage:
 *   npx tsx scripts/seed-test-availability.ts
 *   npx tsx scripts/seed-test-availability.ts my-slug
 */
import * as dotenv from "dotenv";
import { and, eq } from "drizzle-orm";
import { db } from "../src/db";
import { availability, businesses, services, staff } from "../src/db/schema";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const DEFAULT_DAYS = [0, 1, 2, 3, 4, 5, 6]; // Sun–Sat for easy local QA

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

  const members = await db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .where(and(eq(staff.businessId, business.id), eq(staff.isActive, true)));

  if (members.length === 0) {
    console.error(`No active staff for "${slug}"`);
    process.exit(1);
  }

  for (const member of members) {
    const existing = await db
      .select({ dayOfWeek: availability.dayOfWeek })
      .from(availability)
      .where(eq(availability.staffId, member.id));

    const have = new Set(existing.map((row) => row.dayOfWeek));
    const missing = DEFAULT_DAYS.filter((day) => !have.has(day));

    if (missing.length > 0) {
      await db.insert(availability).values(
        missing.map((dayOfWeek) => ({
          staffId: member.id,
          dayOfWeek,
          startTime: "09:00",
          endTime: "17:00",
        })),
      );
    }

    console.log(
      `${member.name}: ${existing.length} → ${existing.length + missing.length} weekly windows (added ${missing.length})`,
    );
  }

  await db
    .update(services)
    .set({ minimumNoticeHours: 0 })
    .where(eq(services.businessId, business.id));

  console.log(
    `Done — ${business.name} (${business.slug}) has Mon–Sat 09:00–17:00 availability and 0h minimum notice for testing.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
