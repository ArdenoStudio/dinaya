import { NextRequest, NextResponse } from "next/server";
import { requireDesktopWrite } from "@/app/api/v1/desktop/_shared";
import {
  availabilityOverrideDeleteSchema,
  availabilityOverrideUpsertSchema,
  deleteAvailabilityDashboardOverride,
  getAvailabilityDashboardOverview,
  upsertAvailabilityDashboardOverride,
} from "@/lib/dashboard/availability";
import { withRateLimit } from "@/lib/rate-limit";

async function respondWithOverview(businessId: string) {
  const overview = await getAvailabilityDashboardOverview(businessId);
  return NextResponse.json({
    ...overview,
    serverTime: new Date().toISOString(),
    webUrl: "/dashboard/availability",
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireDesktopWrite(req);
  if (!authResult.ok) return authResult.response;
  const { businessId, deviceId } = authResult.context;

  const limited = await withRateLimit(req, {
    scope: "desktop-availability-override-upsert",
    limit: 90,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  const parsed = availabilityOverrideUpsertSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid availability override." }, { status: 400 });
  }

  const result = await upsertAvailabilityDashboardOverride(businessId, parsed.data);
  if (result.status === "not_found") return NextResponse.json({ error: result.error }, { status: 404 });
  if (result.status === "invalid") return NextResponse.json({ error: result.error }, { status: 400 });

  return respondWithOverview(businessId);
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireDesktopWrite(req);
  if (!authResult.ok) return authResult.response;
  const { businessId, deviceId } = authResult.context;

  const limited = await withRateLimit(req, {
    scope: "desktop-availability-override-delete",
    limit: 90,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  const parsed = availabilityOverrideDeleteSchema.safeParse({
    id: req.nextUrl.searchParams.get("id"),
    staffId: req.nextUrl.searchParams.get("staffId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid availability override." }, { status: 400 });
  }

  const result = await deleteAvailabilityDashboardOverride(businessId, parsed.data);
  if (result.status === "not_found") return NextResponse.json({ error: result.error }, { status: 404 });

  return respondWithOverview(businessId);
}
