import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses, voiceIntegrations } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import {
  PlanRequiredError,
  canUseFeature,
  getBusinessPlan,
  planDisplayName,
  requirePro,
} from "@/lib/plan";
import {
  normalizeVoiceLanguages,
  serializeVoiceIntegration,
} from "@/lib/voice-receptionist";
import { z } from "@/lib/validation";

const setupSchema = z.object({
  businessPhone: z.string().trim().min(5).max(30),
  handoffPhone: z.string().trim().min(5).max(30),
  languages: z.array(z.enum(["en", "si", "ta"])).min(1).max(3).default(["en"]),
  welcomeMessage: z.string().trim().max(1000).optional().nullable(),
  fallbackMessage: z.string().trim().max(1000).optional().nullable(),
  openingRules: z.string().trim().max(2000).optional().nullable(),
  serviceRules: z.string().trim().max(3000).optional().nullable(),
  bookingRules: z.string().trim().max(3000).optional().nullable(),
  faqNotes: z.string().trim().max(4000).optional().nullable(),
});

function nullWhenBlank(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

async function requireVoiceAccess(businessId: string): Promise<NextResponse | null> {
  try {
    await requirePro(businessId, "aiVoiceReceptionist");
    return null;
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json(
        {
          error: error.message,
          feature: "aiVoiceReceptionist",
          requiredPlan: planDisplayName(error.requiredPlan),
        },
        { status: 402 },
      );
    }
    throw error;
  }
}

export async function GET() {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const [plan, [business], [integration]] = await Promise.all([
    getBusinessPlan(businessId),
    db
      .select({
        phone: businesses.phone,
      })
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1),
    db
      .select()
      .from(voiceIntegrations)
      .where(eq(voiceIntegrations.businessId, businessId))
      .limit(1),
  ]);

  return NextResponse.json({
    available: canUseFeature(plan, "aiVoiceReceptionist"),
    requiredPlan: "max",
    businessPhone: business?.phone ?? null,
    integration: serializeVoiceIntegration(integration ?? null),
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const accessError = await requireVoiceAccess(businessId);
  if (accessError) return accessError;

  const parsed = setupSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the voice receptionist setup details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const [existing] = await db
    .select()
    .from(voiceIntegrations)
    .where(eq(voiceIntegrations.businessId, businessId))
    .limit(1);

  const now = new Date();
  const currentStatus = existing?.status ?? "not_requested";
  const status = currentStatus === "not_requested" ? "requested" : currentStatus;

  const [integration] = await db
    .insert(voiceIntegrations)
    .values({
      businessId,
      status,
      providerName: existing?.providerName ?? "Peak Agents",
      businessPhone: parsed.data.businessPhone,
      handoffPhone: parsed.data.handoffPhone,
      languages: normalizeVoiceLanguages(parsed.data.languages),
      welcomeMessage: nullWhenBlank(parsed.data.welcomeMessage),
      fallbackMessage: nullWhenBlank(parsed.data.fallbackMessage),
      openingRules: nullWhenBlank(parsed.data.openingRules),
      serviceRules: nullWhenBlank(parsed.data.serviceRules),
      bookingRules: nullWhenBlank(parsed.data.bookingRules),
      faqNotes: nullWhenBlank(parsed.data.faqNotes),
      requestedAt: existing?.requestedAt ?? now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: voiceIntegrations.businessId,
      set: {
        status,
        businessPhone: parsed.data.businessPhone,
        handoffPhone: parsed.data.handoffPhone,
        languages: normalizeVoiceLanguages(parsed.data.languages),
        welcomeMessage: nullWhenBlank(parsed.data.welcomeMessage),
        fallbackMessage: nullWhenBlank(parsed.data.fallbackMessage),
        openingRules: nullWhenBlank(parsed.data.openingRules),
        serviceRules: nullWhenBlank(parsed.data.serviceRules),
        bookingRules: nullWhenBlank(parsed.data.bookingRules),
        faqNotes: nullWhenBlank(parsed.data.faqNotes),
        requestedAt: existing?.requestedAt ?? now,
        updatedAt: now,
      },
    })
    .returning();

  return NextResponse.json({ integration: serializeVoiceIntegration(integration) });
}
