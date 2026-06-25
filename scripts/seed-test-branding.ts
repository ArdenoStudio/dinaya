/**
 * Sets logo and hero banner (first gallery image) for the test booking business.
 *
 * Usage:
 *   SEED_LOGO_URL=https://... SEED_BANNER_URL=https://... npx tsx scripts/seed-test-branding.ts
 *   npx tsx scripts/seed-test-branding.ts my-slug
 */
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { db } from "../src/db";
import { businesses } from "../src/db/schema";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const logoUrl = process.env.SEED_LOGO_URL?.trim() || null;
const bannerUrl = process.env.SEED_BANNER_URL?.trim() || null;

async function main() {
  const slug =
    process.argv[2] && !process.argv[2].startsWith("--") ? process.argv[2] : "test";

  if (!logoUrl && !bannerUrl) {
    console.log(
      "Skipping branding — set SEED_LOGO_URL and/or SEED_BANNER_URL (public HTTPS URLs) to apply logo and banner.",
    );
    process.exit(0);
  }

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
      ...(logoUrl ? { logoUrl } : {}),
      ...(bannerUrl ? { galleryImages: [bannerUrl] } : {}),
    })
    .where(eq(businesses.id, business.id));

  const parts = [
    logoUrl ? `logo → ${logoUrl}` : null,
    bannerUrl ? `banner → ${bannerUrl}` : null,
  ].filter(Boolean);

  console.log(`Done — ${business.name} (${business.slug}): ${parts.join(", ")}`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
