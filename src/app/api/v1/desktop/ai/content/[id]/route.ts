import { NextRequest, NextResponse } from "next/server";
import { requireDesktopWrite } from "@/app/api/v1/desktop/_shared";
import { aiContentActionSchema, updateAiContentDashboardAction } from "@/lib/dashboard/ai";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { withRateLimit } from "@/lib/rate-limit";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireDesktopWrite(req);
  if (!authResult.ok) return authResult.response;
  const { businessId, deviceId } = authResult.context;
  const { id } = await params;

  const limited = await withRateLimit(req, {
    scope: "desktop-ai-content-update",
    limit: 90,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  try {
    await requirePro(businessId, "aiContentMachine");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const parsed = aiContentActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid content update." }, { status: 400 });
  }

  try {
    const item = await updateAiContentDashboardAction(businessId, id, parsed.data.action);
    if (!item) return NextResponse.json({ error: "Not found." }, { status: 404 });
    return NextResponse.json({
      item,
      serverTime: new Date().toISOString(),
      webUrl: "/dashboard/ai",
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update AI content." },
      { status: 400 },
    );
  }
}
