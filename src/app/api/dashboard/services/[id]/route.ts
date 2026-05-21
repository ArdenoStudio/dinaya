import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, services } from "@/db/schema";
import { eq, and, gte, inArray } from "drizzle-orm";
import { requireApiBusiness } from "@/lib/api-auth";
import { serviceUpdateSchema } from "@/lib/schemas/services";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiBusiness();
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const { id } = await params;
  const [service] = await db
    .select({
      id: services.id,
      businessId: services.businessId,
      name: services.name,
      description: services.description,
      durationMinutes: services.durationMinutes,
      priceLkr: services.priceLkr,
      depositPercent: services.depositPercent,
      requiresPayment: services.requiresPayment,
      isActive: services.isActive,
      beforeBuffer: services.beforeBuffer,
      afterBuffer: services.afterBuffer,
      minimumNoticeHours: services.minimumNoticeHours,
      dailyCapacity: services.dailyCapacity,
      createdAt: services.createdAt,
    })
    .from(services)
    .where(and(eq(services.id, id), eq(services.businessId, businessId)))
    .limit(1);

  if (!service) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(service);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const { id } = await params;
  const parsed = serviceUpdateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the service details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const body = parsed.data;

  const [existing] = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.id, id), eq(services.businessId, businessId)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (body.isActive === false && !body.forceDeactivate) {
    const futureBookings = await db
      .select({ id: bookings.id })
      .from(bookings)
      .where(
        and(
          eq(bookings.businessId, businessId),
          eq(bookings.serviceId, id),
          gte(bookings.startsAt, new Date()),
          inArray(bookings.status, ["pending", "confirmed"]),
        ),
      )
      .limit(1);

    if (futureBookings.length > 0) {
      return NextResponse.json(
        {
          error:
            "This service has future bookings. Confirm deactivation to keep existing bookings but hide it from public booking.",
        },
        { status: 409 },
      );
    }
  }

  const allowedFields = [
    "name",
    "description",
    "durationMinutes",
    "priceLkr",
    "depositPercent",
    "requiresPayment",
    "isActive",
    "beforeBuffer",
    "afterBuffer",
    "minimumNoticeHours",
    "dailyCapacity",
  ] as const;

  const update: Record<string, unknown> = {};
  for (const field of allowedFields) {
    if (field in body) {
      update[field] = body[field] === "" || body[field] === null ? null : body[field];
    }
  }
  if ("depositPercent" in update) {
    update.depositPercent = Math.min(100, Math.max(0, Number(update.depositPercent) || 0));
  }

  const [updated] = await db
    .update(services)
    .set(update)
    .where(eq(services.id, id))
    .returning({
      id: services.id,
      businessId: services.businessId,
      name: services.name,
      description: services.description,
      durationMinutes: services.durationMinutes,
      priceLkr: services.priceLkr,
      depositPercent: services.depositPercent,
      requiresPayment: services.requiresPayment,
      isActive: services.isActive,
      beforeBuffer: services.beforeBuffer,
      afterBuffer: services.afterBuffer,
      minimumNoticeHours: services.minimumNoticeHours,
      dailyCapacity: services.dailyCapacity,
      createdAt: services.createdAt,
    });

  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const { id } = await params;

  const [existing] = await db
    .select({ id: services.id })
    .from(services)
    .where(and(eq(services.id, id), eq(services.businessId, businessId)))
    .limit(1);

  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const futureBookings = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.businessId, businessId),
        eq(bookings.serviceId, id),
        gte(bookings.startsAt, new Date()),
        inArray(bookings.status, ["pending", "confirmed"]),
      ),
    )
    .limit(1);

  if (futureBookings.length > 0) {
    return NextResponse.json(
      { error: "Deactivate this service instead, or cancel/reassign future bookings first." },
      { status: 409 },
    );
  }

  await db.delete(services).where(eq(services.id, id));
  return NextResponse.json({ success: true });
}
