import SettingsForm from "@/components/dashboard/SettingsForm";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { canUseFeature, resolveEffectivePlan } from "@/lib/plan";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { getAppBaseUrl } from "@/lib/booking-url";

export default async function BookingPageEditorRoute() {
  const { businessId } = await requireOwner();
  const [business] = await db
    .select({
      address: businesses.address,
      bankTransferInstructions: businesses.bankTransferInstructions,
      businessType: businesses.businessType,
      cancellationPolicy: businesses.cancellationPolicy,
      description: businesses.description,
      depositPolicy: businesses.depositPolicy,
      facebookUrl: businesses.facebookUrl,
      galleryImages: businesses.galleryImages,
      instagramUrl: businesses.instagramUrl,
      language: businesses.language,
      lankaqrImageUrl: businesses.lankaqrImageUrl,
      name: businesses.name,
      payhereEnabled: businesses.payhereEnabled,
      payhereMerchantId: businesses.payhereMerchantId,
      hasPayhereMerchantSecret: businesses.payhereMerchantSecret,
      hideDinayaBranding: businesses.hideDinayaBranding,
      accentColor: businesses.accentColor,
      customDomain: businesses.customDomain,
      customDomainVerified: businesses.customDomainVerified,
      plan: businesses.plan,
      planExpiresAt: businesses.planExpiresAt,
      phone: businesses.phone,
      slug: businesses.slug,
      timezone: businesses.timezone,
      websiteUrl: businesses.websiteUrl,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) notFound();

  const effectivePlan = resolveEffectivePlan({
    storedPlan: business.plan,
    planExpiresAt: business.planExpiresAt,
  });
  const previewUrl = `${getAppBaseUrl().replace(/\/$/, "")}/embed/book/${business.slug}?embed=1&hideGallery=0`;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Booking page"
        description="Edit how your public booking page looks and preview it live."
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <SettingsForm
          business={{
            ...business,
            hasPayhereMerchantSecret: Boolean(business.hasPayhereMerchantSecret),
            customDomainVerified: Boolean(business.customDomainVerified),
            canCustomizeBookingPage: canUseFeature(effectivePlan, "publicBookingPageCustomization"),
          }}
        />
        <div className="rounded-xl border bg-white p-5 xl:sticky xl:top-6 xl:self-start">
          <h2 className="mb-3 font-semibold">Live preview</h2>
          <iframe
            src={previewUrl}
            title="Booking page preview"
            className="h-[min(80vh,900px)] w-full rounded-lg border"
          />
        </div>
      </div>
    </div>
  );
}
