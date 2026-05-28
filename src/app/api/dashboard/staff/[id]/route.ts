import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { bookings, staff } from "@/db/schema";
import { requireApiBusiness } from "@/lib/api-auth";
import {
  getStaffDashboardDetail,
  staffDashboardUpdateSchema,
  updateStaffDashboardFields,
} from "@/lib/dashboard/staff";

export async function GET(req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  const detail = await getStaffDashboardDetail(businessId, id);
  if (!detail) return NextResponse.json({ error: "Not found." }, { status: 404 });

  return NextResponse.json({
    ...detail.staff,
    serviceIds: detail.assignedServices.map((row) => row.id),
    locationIds: detail.assignedLocations.map((row) => row.id),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  const parsed = staffDashboardUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the staff details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const result = await updateStaffDashboardFields(businessId, id, parsed.data);
  if (result.status === "not_found") return NextResponse.json({ error: result.error }, { status: 404 });
  if (result.status === "invalid") return NextResponse.json({ error: result.error }, { status: 400 });

  return NextResponse.json({ id });
}

export async function DELETE(req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  const futureBookings = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.businessId, businessId),
        eq(bookings.staffId, id),
        gte(bookings.startsAt, new Date()),
        inArray(bookings.status, ["pending", "confirmed"]),
      ),
    )
    .limit(1);

  if (futureBookings.length > 0) {
    return NextResponse.json(
      { error: "Reassign or cancel future bookings before deleting this staff member." },
      { status: 409 },
    );
  }

  await db.delete(staff).where(and(eq(staff.id, id), eq(staff.businessId, businessId)));
  return NextResponse.json({ success: true });
}
