import { NextRequest, NextResponse } from "next/server";
import { requireDesktopRead } from "@/app/api/v1/desktop/_shared";
import { getBillingDashboardOverview } from "@/lib/dashboard/billing";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const authResult = await requireDesktopRead(req);
  if (!authResult.ok) return authResult.response;
  const { businessId, deviceId } = authResult.context;

  const limited = await withRateLimit(req, {
    scope: "desktop-billing",
    limit: 120,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  const billing = await getBillingDashboardOverview(businessId);
  return NextResponse.json({
    ...billing,
    serverTime: new Date().toISOString(),
    webUrl: "/dashboard/billing",
  });
}
