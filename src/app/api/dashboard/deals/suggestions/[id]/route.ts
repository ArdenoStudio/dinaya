import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { updateDealSuggestionStatus } from "@/lib/deals/suggestions";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { z } from "@/lib/validation";

type RouteParams = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  status: z.enum(["accepted", "dismissed"]).optional(),
});

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  try {
    await requirePro(businessId, "aiDealSuggestions");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => ({})));
  const status = parsed.success ? parsed.data.status ?? "accepted" : "accepted";

  const updated = await updateDealSuggestionStatus(businessId, id, status);
  if (!updated) {
    return NextResponse.json({ error: "Suggestion not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
