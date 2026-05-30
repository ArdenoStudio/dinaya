import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, services } from "@/db/schema";
import { and, eq, gte, inArray } from "drizzle-orm";
import { requireApiBusiness } from "@/lib/api-auth";
import {
  getServiceDashboardDetail,
  updateServiceDashboardFields,
} from "@/lib/dashboard/services";
import { serviceUpdateSchema } from "@/lib/schemas/services";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const { id } = await params;
  const detail = await getServiceDashboardDetail(businessId, id);

  if (!detail) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(detail.service);
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
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

  const result = await updateServiceDashboardFields(businessId, id, parsed.data);
  if (result.status === "not_found") return NextResponse.json({ error: result.error }, { status: 404 });
  if (result.status === "future_bookings") return NextResponse.json({ error: result.error }, { status: 409 });

  return NextResponse.json(result.service);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
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
