import { BookingPageEditor } from "@/components/dashboard/BookingPageEditor";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { canUseFeature, resolveEffectivePlan } from "@/lib/plan";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function BookingPageEditorRoute() {
  const { businessId } = await requireOwner();
  const [business] = await db
    .select({
      accentColor: businesses.accentColor,
      bookingPageBackground: businesses.bookingPageBackground,
      bookingPageBackgroundColor: businesses.bookingPageBackgroundColor,
      bookingHeroOverlay: businesses.bookingHeroOverlay,
      bookingHeroOverlayOpacity: businesses.bookingHeroOverlayOpacity,
      bookingThemePreset: businesses.bookingThemePreset,
      bookingPanelBackground: businesses.bookingPanelBackground,
      customDomain: businesses.customDomain,
      customDomainVerified: businesses.customDomainVerified,
      description: businesses.description,
      galleryImages: businesses.galleryImages,
      hideDinayaBranding: businesses.hideDinayaBranding,
      logoUrl: businesses.logoUrl,
      name: businesses.name,
      plan: businesses.plan,
      planExpiresAt: businesses.planExpiresAt,
      slug: businesses.slug,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) notFound();

  const effectivePlan = resolveEffectivePlan({
    storedPlan: business.plan,
    planExpiresAt: business.planExpiresAt,
  });

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Booking page"
        description="Customize how your public booking page looks. Changes preview live on the right."
      />
      <BookingPageEditor
        business={{
          ...business,
          customDomainVerified: Boolean(business.customDomainVerified),
          canCustomizeBookingPage: canUseFeature(effectivePlan, "publicBookingPageCustomization"),
          canUseBookingPageTheme: canUseFeature(effectivePlan, "bookingPageTheme"),
        }}
      />
    </div>
  );
}
