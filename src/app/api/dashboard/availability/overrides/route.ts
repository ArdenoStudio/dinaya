import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { availabilityOverrides, staff } from "@/db/schema";
import { eq, and } from "drizzle-orm";

async function verifyStaff(staffId: string, businessId: string) {
  const [member] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.businessId, businessId)))
    .limit(1);
  return member ?? null;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = (session.user as { businessId: string }).businessId;
  const staffId = req.nextUrl.searchParams.get("staffId");
  if (!staffId) return NextResponse.json({ error: "staffId required" }, { status: 400 });

  if (!(await verifyStaff(staffId, businessId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const rows = await db
    .select()
    .from(availabilityOverrides)
    .where(eq(availabilityOverrides.staffId, staffId))
    .orderBy(availabilityOverrides.date);

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = (session.user as { businessId: string }).businessId;
  const { staffId, date, isBlocked, startTime, endTime, reason } = await req.json();

  if (!staffId || !date) return NextResponse.json({ error: "staffId and date required" }, { status: 400 });
  if (!(await verifyStaff(staffId, businessId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Upsert: delete existing for this staff+date, then insert
  await db
    .delete(availabilityOverrides)
    .where(and(eq(availabilityOverrides.staffId, staffId), eq(availabilityOverrides.date, date)));

  const [row] = await db
    .insert(availabilityOverrides)
    .values({ staffId, date, isBlocked: isBlocked ?? true, startTime: startTime ?? null, endTime: endTime ?? null, reason: reason ?? null })
    .returning();

  return NextResponse.json(row, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const businessId = (session.user as { businessId: string }).businessId;
  const id = req.nextUrl.searchParams.get("id");
  const staffId = req.nextUrl.searchParams.get("staffId");
  if (!id || !staffId) return NextResponse.json({ error: "id and staffId required" }, { status: 400 });

  if (!(await verifyStaff(staffId, businessId))) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await db
    .delete(availabilityOverrides)
    .where(and(eq(availabilityOverrides.id, id), eq(availabilityOverrides.staffId, staffId)));

  return NextResponse.json({ success: true });
}
