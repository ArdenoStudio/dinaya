import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { getLocationForBusiness, updateLocationAiConfig, type LocationAiConfig } from "@/lib/locations";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { z } from "@/lib/validation";

const aiPatchSchema = z.object({
  aiBookingAutopilot: z.boolean().optional(),
  smartReminderSystem: z.boolean().optional(),
  reviewEngine: z.boolean().optional(),
  clientReactivationCampaign: z.boolean().optional(),
  aiUpsellAssistant: z.boolean().optional(),
  aiContentMachine: z.boolean().optional(),
  vipLoyaltySequence: z.boolean().optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  try {
    await requirePro(businessId, "aiBookingAutopilot");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const row = await getLocationForBusiness(businessId, id);
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ aiConfig: row.aiConfig ?? {} });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  try {
    await requirePro(businessId, "aiBookingAutopilot");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const parsed = aiPatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid AI settings." }, { status: 400 });
  }

  const row = await getLocationForBusiness(businessId, id);
  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const next = await updateLocationAiConfig(businessId, id, parsed.data as Partial<LocationAiConfig>);
  return NextResponse.json({ aiConfig: next });
}
