import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok, validationError } from "@/lib/action-result";
import { requireApiBusiness } from "@/lib/api-auth";
import { logActivity } from "@/lib/activity-log";
import { encryptSecret } from "@/lib/secrets";
import { z } from "@/lib/validation";

const settingsSchema = z.object({
  name: z.string().trim().min(1, "Business name is required.").max(100),
  description: z.string().trim().max(2000).optional().nullable(),
  phone: z.string().trim().max(20).optional().nullable(),
  address: z.string().trim().max(1000).optional().nullable(),
  timezone: z.string().trim().min(1).max(80).default("Asia/Colombo"),
  language: z.enum(["en", "si", "ta"]).default("en"),
  businessType: z.string().trim().max(80).optional().nullable(),
  cancellationPolicy: z.string().trim().max(2000).optional().nullable(),
  depositPolicy: z.string().trim().max(2000).optional().nullable(),
  bankTransferInstructions: z.string().trim().max(2000).optional().nullable(),
  lankaqrImageUrl: z.string().trim().max(1000).optional().nullable(),
  instagramUrl: z.string().trim().max(500).optional().nullable(),
  facebookUrl: z.string().trim().max(500).optional().nullable(),
  websiteUrl: z.string().trim().max(500).optional().nullable(),
  galleryImages: z.array(z.string().trim().max(1000)).max(12).optional().default([]),
  payhereEnabled: z.boolean().optional(),
  payhereMerchantId: z.string().trim().max(100).optional().nullable(),
  payhereMerchantSecret: z.string().trim().max(1000).optional().nullable(),
});

export async function PATCH(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) {
    return authResult.response;
  }
  const context = authResult.context;

  const parsed = settingsSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(validationError(parsed.error), { status: 400 });
  }

  const {
    address,
    description,
    facebookUrl,
    galleryImages,
    instagramUrl,
    bankTransferInstructions,
    businessType,
    cancellationPolicy,
    depositPolicy,
    language,
    lankaqrImageUrl,
    name,
    payhereEnabled,
    payhereMerchantId,
    payhereMerchantSecret,
    phone,
    timezone,
    websiteUrl,
  } = parsed.data;

  await db
    .update(businesses)
    .set({
      name,
      description: description || null,
      phone: phone || null,
      address: address || null,
      timezone,
      language,
      businessType: businessType || null,
      cancellationPolicy: cancellationPolicy || null,
      depositPolicy: depositPolicy || null,
      bankTransferInstructions: bankTransferInstructions || null,
      lankaqrImageUrl: lankaqrImageUrl || null,
      instagramUrl: instagramUrl || null,
      facebookUrl: facebookUrl || null,
      websiteUrl: websiteUrl || null,
      galleryImages: Array.isArray(galleryImages) ? galleryImages.filter(Boolean) : null,
      ...(payhereEnabled !== undefined && { payhereEnabled: Boolean(payhereEnabled) }),
      ...(payhereMerchantId !== undefined && { payhereMerchantId: payhereMerchantId || null }),
      ...(payhereMerchantSecret !== undefined && payhereMerchantSecret !== null && {
        payhereMerchantSecret: payhereMerchantSecret.trim()
          ? encryptSecret(payhereMerchantSecret)
          : null,
      }),
    })
    .where(eq(businesses.id, context.businessId));

  void logActivity({
    action: "updated",
    actorUserId: context.user.id,
    businessId: context.businessId,
    entity: "business",
    entityId: context.businessId,
    meta: { fields: Object.keys(parsed.data) },
  }).catch((error) => {
    console.error("Activity log write failed:", error);
  });

  return NextResponse.json(ok({ id: context.businessId }));
}
