import SettingsForm from "@/components/dashboard/SettingsForm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requireBusiness } from "@/lib/auth";
import { eq } from "drizzle-orm";

export default async function SettingsPage() {
  const { businessId } = await requireBusiness();
  const [business] = await db
    .select({
      address: businesses.address,
      description: businesses.description,
      facebookUrl: businesses.facebookUrl,
      galleryImages: businesses.galleryImages,
      instagramUrl: businesses.instagramUrl,
      name: businesses.name,
      payhereEnabled: businesses.payhereEnabled,
      payhereMerchantId: businesses.payhereMerchantId,
      payhereMerchantSecret: businesses.payhereMerchantSecret,
      phone: businesses.phone,
      slug: businesses.slug,
      websiteUrl: businesses.websiteUrl,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  return (
    <div>
      <h1 className="font-cal text-2xl mb-6">Settings</h1>
      <SettingsForm business={{ ...business, timezone: "Asia/Colombo" }} />
    </div>
  );
}
