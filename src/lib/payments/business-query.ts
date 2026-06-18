import { db } from "@/db";
import { businesses } from "@/db/schema";
import { hasPublicColumn } from "@/lib/dashboard/db-compat";
import { eq } from "drizzle-orm";

export type BusinessPaymentSettings = {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  bankTransferInstructions: string | null;
  lankaqrImageUrl: string | null;
  payhereEnabled: boolean;
  payhereMerchantId: string | null;
  payhereMerchantSecret: string | null;
  slug: string;
  plan: string;
  language: string | null;
  timezone: string | null;
  paypalEnabled: boolean;
  paypalClientId: string | null;
  paypalClientSecret: string | null;
};

const basePaymentColumns = {
  id: businesses.id,
  email: businesses.email,
  phone: businesses.phone,
  name: businesses.name,
  bankTransferInstructions: businesses.bankTransferInstructions,
  lankaqrImageUrl: businesses.lankaqrImageUrl,
  payhereEnabled: businesses.payhereEnabled,
  payhereMerchantId: businesses.payhereMerchantId,
  payhereMerchantSecret: businesses.payhereMerchantSecret,
  slug: businesses.slug,
  plan: businesses.plan,
  language: businesses.language,
  timezone: businesses.timezone,
} as const;

export async function getBusinessPaymentSettings(
  businessId: string,
): Promise<BusinessPaymentSettings | null> {
  const includePaypal = await hasPublicColumn("businesses", "paypal_enabled");

  const [row] = await db
    .select(
      includePaypal
        ? {
            ...basePaymentColumns,
            paypalEnabled: businesses.paypalEnabled,
            paypalClientId: businesses.paypalClientId,
            paypalClientSecret: businesses.paypalClientSecret,
          }
        : basePaymentColumns,
    )
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!row) return null;

  if (includePaypal) {
    return row as BusinessPaymentSettings;
  }

  return {
    ...row,
    paypalEnabled: false,
    paypalClientId: null,
    paypalClientSecret: null,
  };
}
