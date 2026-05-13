import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { clients, bookings, services, staff, clientNotes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;
  const { id } = await params;

  const [client] = await db
    .select()
    .from(clients)
    .where(and(eq(clients.id, id), eq(clients.businessId, businessId)))
    .limit(1);

  if (!client) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const bookingHistory = await db
    .select({
      id: bookings.id,
      startsAt: bookings.startsAt,
      status: bookings.status,
      serviceName: services.name,
      staffName: staff.name,
    })
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .innerJoin(staff, eq(bookings.staffId, staff.id))
    .where(eq(bookings.clientId, id))
    .orderBy(desc(bookings.startsAt));

  const notes = await db
    .select()
    .from(clientNotes)
    .where(eq(clientNotes.clientId, id))
    .orderBy(desc(clientNotes.createdAt));

  return NextResponse.json({ client, bookings: bookingHistory, notes });
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
  const { name, phone, email, stage, source, tags, internalNotes } = body;

  const [updated] = await db
    .update(clients)
    .set({
      ...(name !== undefined && { name }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(stage !== undefined && { stage }),
      ...(source !== undefined && { source }),
      ...(tags !== undefined && { tags }),
      ...(internalNotes !== undefined && { internalNotes }),
    })
    .where(and(eq(clients.id, id), eq(clients.businessId, businessId)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;
  const { id } = await params;

  await db
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.businessId, businessId)));

  return new NextResponse(null, { status: 204 });
}
