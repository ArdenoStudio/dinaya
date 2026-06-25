/**
 * Sets logo and hero banner (first gallery image) for the test booking business.
 *
 * Usage:
 *   npx tsx scripts/seed-test-branding.ts
 *   npx tsx scripts/seed-test-branding.ts my-slug
 */
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { businesses } from "../src/db/schema";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

/** Served from public/demo/ — works on localhost and dinaya.lk. */
export const TEST_SALON_LOGO_PATH = "/demo/test-salon-logo.webp";
export const TEST_SALON_BANNER_PATH = "/demo/test-salon-banner.webp";

async function main() {
  const slug =
    process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "test";

  const [business] = await db
    .select({ id: businesses.id, name: businesses.name, slug: businesses.slug })
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);

  if (!business) {
    console.error(`No business found with slug "${slug}"`);
    process.exit(1);
  }

  await db
    .update(businesses)
    .set({
      logoUrl: TEST_SALON_LOGO_PATH,
      galleryImages: [TEST_SALON_BANNER_PATH],
    })
    .where(eq(businesses.id, business.id));

  console.log(
    `Done — ${business.name} (${business.slug}): logo → ${TEST_SALON_LOGO_PATH}, banner → ${TEST_SALON_BANNER_PATH}`,
  );
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
