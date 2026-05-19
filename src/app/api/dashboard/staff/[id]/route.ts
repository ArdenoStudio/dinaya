import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { bookings, services, staff, staffServices } from "@/db/schema";
import { z } from "@/lib/validation";

const staffSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100).optional(),
  bio: z.string().trim().max(1000).optional().nullable(),
  avatarUrl: z.url().optional().nullable().or(z.literal("")),
  isActive: z.boolean().optional(),
  serviceIds: z.array(z.uuid()).optional(),
});

async function getBusinessId() {
  const session = await auth();
  return session?.user?.businessId ?? null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = await getBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const [member] = await db
    .select({
      id: staff.id,
      name: staff.name,
      bio: staff.bio,
      avatarUrl: staff.avatarUrl,
      isActive: staff.isActive,
      createdAt: staff.createdAt,
    })
    .from(staff)
    .where(and(eq(staff.id, id), eq(staff.businessId, businessId)))
    .limit(1);

  if (!member) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const assigned = await db
    .select({ serviceId: staffServices.serviceId })
    .from(staffServices)
    .innerJoin(services, eq(services.id, staffServices.serviceId))
    .where(and(eq(staffServices.staffId, id), eq(services.businessId, businessId)));

  return NextResponse.json({
    ...member,
    serviceIds: assigned.map((row) => row.serviceId),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = await getBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const parsed = staffSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the staff details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const [existing] = await db
    .select({ id: staff.id })
    .from(staff)
    .where(and(eq(staff.id, id), eq(staff.businessId, businessId)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

  const { serviceIds, ...fields } = parsed.data;
  const update: Partial<typeof staff.$inferInsert> = {};

  if (fields.name !== undefined) update.name = fields.name;
  if (fields.bio !== undefined) update.bio = fields.bio || null;
  if (fields.avatarUrl !== undefined) update.avatarUrl = fields.avatarUrl || null;
  if (fields.isActive !== undefined) update.isActive = fields.isActive;

  if (Object.keys(update).length > 0) {
    await db.update(staff).set(update).where(eq(staff.id, id));
  }

  if (serviceIds) {
    const validServices = serviceIds.length
      ? await db
          .select({ id: services.id })
          .from(services)
          .where(and(eq(services.businessId, businessId), inArray(services.id, serviceIds)))
      : [];

    if (validServices.length !== serviceIds.length) {
      return NextResponse.json({ error: "One or more services are invalid." }, { status: 400 });
    }

    await db.delete(staffServices).where(eq(staffServices.staffId, id));
    if (serviceIds.length > 0) {
      await db.insert(staffServices).values(serviceIds.map((serviceId) => ({ staffId: id, serviceId })));
    }
  }

  return NextResponse.json({ id });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const businessId = await getBusinessId();
  if (!businessId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const futureBookings = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.businessId, businessId),
        eq(bookings.staffId, id),
        gte(bookings.startsAt, new Date()),
        inArray(bookings.status, ["pending", "confirmed"])
      )
    )
    .limit(1);

  if (futureBookings.length > 0) {
    return NextResponse.json(
      { error: "Reassign or cancel future bookings before deleting this staff member." },
      { status: 409 }
    );
  }

  await db.delete(staff).where(and(eq(staff.id, id), eq(staff.businessId, businessId)));
  return NextResponse.json({ success: true });
}
