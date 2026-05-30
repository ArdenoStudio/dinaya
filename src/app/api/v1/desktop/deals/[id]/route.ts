import { NextRequest, NextResponse } from "next/server";
import { requireDesktopRead } from "@/app/api/v1/desktop/_shared";
import { getDealDashboardDetail } from "@/lib/dashboard/deals";
import { PlanRequiredError, requirePro } from "@/lib/plan";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireDesktopRead(req);
  if (!authResult.ok) return authResult.response;
  const { businessId, deviceId } = authResult.context;
  const { id } = await params;

  const limited = await withRateLimit(req, {
    scope: "desktop-deal-detail",
    limit: 240,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  try {
    await requirePro(businessId, "deals");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const detail = await getDealDashboardDetail(businessId, id);
  if (!detail) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    ...detail,
    serverTime: new Date().toISOString(),
    webUrl: "/dashboard/deals",
  });
}
