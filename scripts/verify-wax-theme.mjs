import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
delete process.env.DATABASE_URL_DIRECT;

const { loadBookingPageData } = await import("../src/lib/booking/load-page-data.ts");
const { resolveBookingTheme } = await import("../src/lib/booking-theme.ts");
const { canUseFeature, resolveEffectivePlan } = await import("../src/lib/plan.ts");

const data = await loadBookingPageData("wax-in-the-city");
if (!data) {
  console.error("wax-in-the-city not found");
  process.exit(1);
}

const plan = resolveEffectivePlan(data.business);
const theme = resolveBookingTheme(data.business, {
  canUseExtendedTheme: canUseFeature(plan, "bookingPageTheme"),
});

console.log(JSON.stringify({ plan, theme, logoUrl: data.business.logoUrl, hero: data.business.galleryImages?.[0] }, null, 2));
