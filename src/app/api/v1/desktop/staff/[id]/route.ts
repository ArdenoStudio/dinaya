import { NextRequest, NextResponse } from "next/server";
import { requireDesktopRead, requireDesktopWrite } from "@/app/api/v1/desktop/_shared";
import {
  getStaffDashboardDetail,
  staffDashboardUpdateSchema,
  updateStaffDashboardFields,
} from "@/lib/dashboard/staff";
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
    scope: "desktop-staff-detail",
    limit: 240,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  const detail = await getStaffDashboardDetail(businessId, id);
  if (!detail) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    ...detail,
    serverTime: new Date().toISOString(),
    webUrl: `/dashboard/staff/${id}`,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireDesktopWrite(req);
  if (!authResult.ok) return authResult.response;
  const { businessId, deviceId } = authResult.context;
  const { id } = await params;

  const limited = await withRateLimit(req, {
    scope: "desktop-staff-update",
    limit: 90,
    windowSeconds: 60,
  }, { keySuffix: `${businessId}:${deviceId ?? "unknown"}` });
  if (!limited.ok) return limited.response;

  const parsed = staffDashboardUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Please check the staff details." }, { status: 400 });
  }

  const result = await updateStaffDashboardFields(businessId, id, parsed.data);
  if (result.status === "not_found") return NextResponse.json({ error: result.error }, { status: 404 });
  if (result.status === "invalid") return NextResponse.json({ error: result.error }, { status: 400 });

  const detail = await getStaffDashboardDetail(businessId, id);
  if (!detail) {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }

  return NextResponse.json({
    ...detail,
    serverTime: new Date().toISOString(),
    webUrl: `/dashboard/staff/${id}`,
  });
}
