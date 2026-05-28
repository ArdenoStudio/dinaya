import { NextRequest, NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import {
  getLocationDashboardDetail,
  locationDashboardUpdateSchema,
  updateLocationDashboardFields,
} from "@/lib/dashboard/locations";
import { getLocationForBusiness } from "@/lib/locations";

export async function GET(req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  const detail = await getLocationDashboardDetail(businessId, id);
  if (!detail) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json({
    ...detail.location,
    staffCount: detail.assignedStaff.length,
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  const parsed = locationDashboardUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the location details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const result = await updateLocationDashboardFields(businessId, id, parsed.data);
  if (result.status === "not_found") return NextResponse.json({ error: result.error }, { status: 404 });
  if (result.status === "invalid") return NextResponse.json({ error: result.error }, { status: 400 });
  if (result.status === "conflict") return NextResponse.json({ error: result.error }, { status: 409 });

  const updated = await getLocationForBusiness(businessId, id);
  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  const existing = await getLocationForBusiness(businessId, id);
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  if (existing.isDefault) {
    return NextResponse.json(
      { error: "Set another branch as default before deleting this one." },
      { status: 409 }
    );
  }

  await db.delete(locations).where(and(eq(locations.id, id), eq(locations.businessId, businessId)));
  return NextResponse.json({ success: true });
}
