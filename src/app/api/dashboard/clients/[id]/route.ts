import { NextRequest, NextResponse } from "next/server";
import { requireApiBusiness } from "@/lib/api-auth";
import { db } from "@/db";
import { clients, bookings, services, staff, clientNotes } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { normalizeSriLankanPhone } from "@/lib/phone";
import { z } from "@/lib/validation";

const clientPatchSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  phone: z.string().trim().min(7).max(30).optional(),
  email: z.email().optional().nullable().or(z.literal("")),
  stage: z.enum(["lead", "prospect", "active", "churned"]).optional(),
  source: z.string().trim().max(100).optional().nullable(),
  tags: z.array(z.string().trim().max(40)).optional().nullable(),
  internalNotes: z.string().trim().max(5000).optional().nullable(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
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
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  const parsed = clientPatchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the client details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { name, phone, email, stage, source, tags, internalNotes } = parsed.data;

  const [updated] = await db
    .update(clients)
    .set({
      ...(name !== undefined && { name }),
	      ...(phone !== undefined && { phone: normalizeSriLankanPhone(phone) }),
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
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;
  const { id } = await params;

  await db
    .delete(clients)
    .where(and(eq(clients.id, id), eq(clients.businessId, businessId)));

  return new NextResponse(null, { status: 204 });
}
