import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import {
  availabilityOverrideDeleteSchema,
  availabilityOverrideUpsertSchema,
  deleteAvailabilityDashboardOverride,
  listAvailabilityDashboardOverrides,
  upsertAvailabilityDashboardOverride,
} from "@/lib/dashboard/availability";

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const staffId = req.nextUrl.searchParams.get("staffId");
  if (!staffId) return NextResponse.json({ error: "staffId required" }, { status: 400 });

  const result = await listAvailabilityDashboardOverrides(businessId, staffId);
  if (result.status === "not_found") return NextResponse.json({ error: result.error }, { status: 404 });

  return NextResponse.json(result.rows);
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const parsed = availabilityOverrideUpsertSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "staffId and date required" }, { status: 400 });

  const result = await upsertAvailabilityDashboardOverride(businessId, parsed.data);
  if (result.status === "not_found") return NextResponse.json({ error: result.error }, { status: 404 });
  if (result.status === "invalid") return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json(result.override, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const parsed = availabilityOverrideDeleteSchema.safeParse({
    id: req.nextUrl.searchParams.get("id"),
    staffId: req.nextUrl.searchParams.get("staffId"),
  });
  if (!parsed.success) return NextResponse.json({ error: "id and staffId required" }, { status: 400 });

  const result = await deleteAvailabilityDashboardOverride(businessId, parsed.data);
  if (result.status === "not_found") return NextResponse.json({ error: result.error }, { status: 404 });

  return NextResponse.json({ success: true });
}
