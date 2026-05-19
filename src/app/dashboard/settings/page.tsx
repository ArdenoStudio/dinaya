import SettingsForm from "@/components/dashboard/SettingsForm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requireBusiness } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function SettingsPage() {
  const { businessId } = await requireBusiness();
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
    <div>
      <h1 className="font-cal text-2xl mb-6">Settings</h1>
      <SettingsForm
        business={{
          ...business,
          hasPayhereMerchantSecret: Boolean(business?.hasPayhereMerchantSecret),
        }}
      />
    </div>
  );
}
