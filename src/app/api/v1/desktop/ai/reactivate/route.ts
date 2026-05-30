import { NextRequest, NextResponse } from "next/server";
import { requireDesktopWrite } from "@/app/api/v1/desktop/_shared";
import { aiReactivationRequestSchema, runAiReactivationDashboard } from "@/lib/dashboard/ai";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { withRateLimit } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const authResult = await requireDesktopWrite(req);
  if (!authResult.ok) return authResult.response;
  const { businessId, deviceId } = authResult.context;

  const limited = await withRateLimit(req, {
    scope: "desktop-ai-reactivate",
    limit: 12,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  try {
    await requirePro(businessId, "clientReactivationCampaign");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const parsed = aiReactivationRequestSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid reactivation request." }, { status: 400 });
  }

  const result = await runAiReactivationDashboard(businessId, {
    clientId: parsed.data.clientId,
  });

  return NextResponse.json({
    ...result,
    serverTime: new Date().toISOString(),
    webUrl: "/dashboard/ai",
  });
}
