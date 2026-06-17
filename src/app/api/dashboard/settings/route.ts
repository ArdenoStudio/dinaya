import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { ok, validationError } from "@/lib/action-result";
import { requireApiBusiness } from "@/lib/api-auth";
import { logActivity } from "@/lib/activity-log";
import { encryptSecret } from "@/lib/secrets";
import { syncBusinessPrimaryLocation } from "@/lib/locations";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { isPublicHttpsUrl, normalizePublicHttpsUrl } from "@/lib/public-url";
import { z } from "@/lib/validation";

const publicHttpsUrlSchema = z
  .string()
  .trim()
  .max(500)
  .optional()
  .nullable()
  .refine((value) => !value || isPublicHttpsUrl(value), {
    message: "URL must be a public HTTPS link.",
  });

const publicImageUrlSchema = z
  .string()
  .trim()
  .max(1000)
  .optional()
  .nullable()
  .refine((value) => !value || isPublicHttpsUrl(value), {
    message: "Image URL must be a public HTTPS link.",
  });

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
  lankaqrImageUrl: publicImageUrlSchema,
  instagramUrl: publicHttpsUrlSchema,
  facebookUrl: publicHttpsUrlSchema,
  websiteUrl: publicHttpsUrlSchema,
  galleryImages: z
    .array(
      z
        .string()
        .trim()
        .max(1000)
        .refine((value) => isPublicHttpsUrl(value), {
          message: "Gallery image URL must be a public HTTPS link.",
        }),
    )
    .max(12)
    .optional()
    .default([]),
  payhereEnabled: z.boolean().optional(),
  payhereMerchantId: z.string().trim().max(100).optional().nullable(),
  payhereMerchantSecret: z.string().trim().max(1000).optional().nullable(),
  paypalEnabled: z.boolean().optional(),
  paypalClientId: z.string().trim().max(200).optional().nullable(),
  paypalClientSecret: z.string().trim().max(1000).optional().nullable(),
  hideDinayaBranding: z.boolean().optional(),
  accentColor: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, "Accent color must be a hex value like #2563eb.")
    .optional()
    .nullable(),
});

export async function PATCH(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
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
    paypalEnabled,
    paypalClientId,
    paypalClientSecret,
    hideDinayaBranding,
    accentColor,
    phone,
    timezone,
    websiteUrl,
  } = parsed.data;

  if (hideDinayaBranding === true) {
    try {
      await requirePro(context.businessId, "publicBookingPageCustomization");
    } catch (error) {
      if (error instanceof PlanRequiredError) {
        return NextResponse.json(
          { error: "Remove Dinaya branding is available on Growth." },
          { status: 402 },
        );
      }
      throw error;
    }
  }

  if (accentColor) {
    try {
      await requirePro(context.businessId, "publicBookingPageCustomization");
    } catch (error) {
      if (error instanceof PlanRequiredError) {
        return NextResponse.json(
          { error: "Custom booking page colors are available on Growth." },
          { status: 402 },
        );
      }
      throw error;
    }
  }

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
      instagramUrl: normalizePublicHttpsUrl(instagramUrl),
      facebookUrl: normalizePublicHttpsUrl(facebookUrl),
      websiteUrl: normalizePublicHttpsUrl(websiteUrl),
      galleryImages: Array.isArray(galleryImages) ? galleryImages.filter(Boolean) : null,
      ...(payhereEnabled !== undefined && { payhereEnabled: Boolean(payhereEnabled) }),
      ...(payhereMerchantId !== undefined && { payhereMerchantId: payhereMerchantId || null }),
      ...(payhereMerchantSecret !== undefined && payhereMerchantSecret !== null && {
        payhereMerchantSecret: payhereMerchantSecret.trim()
          ? encryptSecret(payhereMerchantSecret)
          : null,
      }),
      ...(paypalEnabled !== undefined && { paypalEnabled: Boolean(paypalEnabled) }),
      ...(paypalClientId !== undefined && { paypalClientId: paypalClientId || null }),
      ...(paypalClientSecret !== undefined && paypalClientSecret !== null && {
        paypalClientSecret: paypalClientSecret.trim()
          ? encryptSecret(paypalClientSecret)
          : null,
      }),
      ...(hideDinayaBranding !== undefined && { hideDinayaBranding: Boolean(hideDinayaBranding) }),
      ...(accentColor !== undefined && { accentColor: accentColor || null }),
    })
    .where(eq(businesses.id, context.businessId));

  await syncBusinessPrimaryLocation(context.businessId, {
    name,
    address: address || null,
    phone: phone || null,
    timezone,
  });

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
