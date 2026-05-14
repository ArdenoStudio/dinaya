import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { bookings, services, staff, clients } from "@/db/schema";
import { eq, and } from "drizzle-orm";

const VALID_STATUSES = ["pending", "confirmed", "cancelled", "completed", "no_show"] as const;
type BookingStatus = (typeof VALID_STATUSES)[number];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;
  const { id } = await params;

  const [row] = await db
    .select({
      id: bookings.id,
      clientId: bookings.clientId,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      clientEmail: bookings.clientEmail,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
      notes: bookings.notes,
      staffNotes: bookings.staffNotes,
      createdAt: bookings.createdAt,
      serviceName: services.name,
      serviceDuration: services.durationMinutes,
      staffName: staff.name,
      clientStage: clients.stage,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(staff, eq(bookings.staffId, staff.id))
    .leftJoin(clients, eq(bookings.clientId, clients.id))
    .where(and(eq(bookings.id, id), eq(bookings.businessId, businessId)))
    .limit(1);

  if (!row) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;
  const { id } = await params;

  const body = await req.json();
  const { status, staffNotes } = body;

  if (status && !VALID_STATUSES.includes(status as BookingStatus)) {
    return NextResponse.json({ error: "Invalid status." }, { status: 400 });
  }

  const [updated] = await db
    .update(bookings)
    .set({
      ...(status !== undefined && { status: status as BookingStatus }),
      ...(staffNotes !== undefined && { staffNotes }),
    })
    .where(and(eq(bookings.id, id), eq(bookings.businessId, businessId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found." }, { status: 404 });
  return NextResponse.json(updated);
}
