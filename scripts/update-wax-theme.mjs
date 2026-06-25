/**
 * Apply logo-matched burgundy theme for Wax in the City.
 * Run: npx tsx scripts/update-wax-theme.mjs
 */
import * as dotenv from "dotenv";
import { eq } from "drizzle-orm";
import { db } from "../src/db/index.ts";
import { businesses } from "../src/db/schema.ts";
import { isResolvableBookingImageUrl } from "../src/lib/booking/hero-image.ts";

dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const SLUG = "wax-in-the-city";
/** Logo burgundy */
const ACCENT = "#451014";
/** Warm ivory page — pairs with dark burgundy without muddy wash */
const PAGE_BG = "#faf7f7";

async function main() {
  const [row] = await db
    .select({
      id: businesses.id,
      galleryImages: businesses.galleryImages,
    })
    .from(businesses)
    .where(eq(businesses.slug, SLUG))
    .limit(1);

  if (!row) {
    console.error(`${SLUG} not found`);
    process.exit(1);
  }

  const gallery = (row.galleryImages ?? []).filter(isResolvableBookingImageUrl);

  await db
    .update(businesses)
    .set({
      accentColor: ACCENT,
      bookingThemePreset: "custom",
      bookingPageBackground: "custom",
      bookingPageBackgroundColor: PAGE_BG,
      bookingPanelBackground: "white",
      bookingHeroOverlay: "brand",
      bookingHeroOverlayOpacity: 48,
      galleryImages: gallery,
    })
    .where(eq(businesses.id, row.id));

  console.log(`Updated ${SLUG} theme:`);
  console.log(`  accent: ${ACCENT}`);
  console.log(`  page: custom ${PAGE_BG}`);
  console.log(`  panel: white`);
  console.log(`  gallery images: ${gallery.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
