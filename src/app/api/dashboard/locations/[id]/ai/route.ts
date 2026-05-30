import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { aiLocationConfigPatchSchema, updateAiLocationDashboardConfig } from "@/lib/dashboard/ai";
import { getLocationForBusiness } from "@/lib/locations";
import { PlanRequiredError, requirePro } from "@/lib/plan";

export async function GET(req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness({ req });
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
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
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

  const parsed = aiLocationConfigPatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid AI settings." }, { status: 400 });
  }

  const updated = await updateAiLocationDashboardConfig(businessId, id, parsed.data);
  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({ aiConfig: updated.aiConfig });
}
