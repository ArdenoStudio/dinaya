import { NextRequest, NextResponse } from "next/server";
import { z } from "@/lib/validation";
import { requireApiBusiness } from "@/lib/api-auth";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { runManualReactivation } from "@/lib/ai/workflows";

const bodySchema = z.object({
  clientId: z.string().uuid().optional(),
});

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  try {
    await requirePro(businessId, "clientReactivationCampaign");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const result = await runManualReactivation(businessId, {
    clientId: parsed.data.clientId,
  });

  return NextResponse.json(result);
}
