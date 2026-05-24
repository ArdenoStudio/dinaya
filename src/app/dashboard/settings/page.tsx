import SettingsForm from "@/components/dashboard/SettingsForm";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requireOwner } from "@/lib/auth";
import { canUseFeature, type Plan } from "@/lib/plan";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function SettingsPage() {
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
      customDomain: businesses.customDomain,
      customDomainVerified: businesses.customDomainVerified,
      plan: businesses.plan,
      phone: businesses.phone,
      slug: businesses.slug,
      timezone: businesses.timezone,
      websiteUrl: businesses.websiteUrl,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) notFound();

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Settings"
        description="Business profile, booking policies, payments, and public page branding."
      />
      <SettingsForm
        business={{
          ...business,
          hasPayhereMerchantSecret: Boolean(business?.hasPayhereMerchantSecret),
          hideDinayaBranding: business.hideDinayaBranding,
          customDomain: business.customDomain,
          customDomainVerified: Boolean(business.customDomainVerified),
          canCustomizeBookingPage: canUseFeature(business.plan as Plan, "publicBookingPageCustomization"),
        }}
      />
    </div>
  );
}
