import { NextRequest, NextResponse } from "next/server";
import { requireDesktopRead, requireDesktopWrite } from "@/app/api/v1/desktop/_shared";
import {
  availabilityWindowsUpdateSchema,
  getAvailabilityDashboardOverview,
  updateAvailabilityDashboardWindows,
} from "@/lib/dashboard/availability";
import { withRateLimit } from "@/lib/rate-limit";

export async function GET(req: NextRequest) {
  const authResult = await requireDesktopRead(req);
  if (!authResult.ok) return authResult.response;
  const { businessId, deviceId } = authResult.context;

  const limited = await withRateLimit(req, {
    scope: "desktop-availability",
    limit: 180,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  const overview = await getAvailabilityDashboardOverview(businessId);

  return NextResponse.json({
    ...overview,
    serverTime: new Date().toISOString(),
    webUrl: "/dashboard/availability",
  });
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireDesktopWrite(req);
  if (!authResult.ok) return authResult.response;
  const { businessId, deviceId } = authResult.context;

  const limited = await withRateLimit(req, {
    scope: "desktop-availability-update",
    limit: 90,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  const parsed = availabilityWindowsUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid availability payload." }, { status: 400 });
  }

  const result = await updateAvailabilityDashboardWindows(
    businessId,
    parsed.data.staffId,
    parsed.data.rows,
  );
  if (result.status === "not_found") return NextResponse.json({ error: result.error }, { status: 404 });
  if (result.status === "invalid") return NextResponse.json({ error: result.error }, { status: 400 });

  const overview = await getAvailabilityDashboardOverview(businessId);
  return NextResponse.json({
    ...overview,
    serverTime: new Date().toISOString(),
    webUrl: "/dashboard/availability",
  });
}
