import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  businesses,
  deals,
  locations,
  services,
  staff,
  staffServices,
} from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { requireApiBusiness } from "@/lib/api-auth";
import { logActivity } from "@/lib/activity-log";
import { listBusinessDeals } from "@/lib/deals/queries";
import { dealCreateSchema } from "@/lib/deals/schema";
import { PlanRequiredError, requirePro } from "@/lib/plan";

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  try {
    await requirePro(businessId, "deals");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const list = await listBusinessDeals(businessId);
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  try {
    await requirePro(businessId, "deals");
  } catch (error) {
    if (error instanceof PlanRequiredError) {
      return NextResponse.json({ error: error.message }, { status: 402 });
    }
    throw error;
  }

  const parsed = dealCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the deal details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const data = parsed.data;

  const [[service], [location]] = await Promise.all([
    db
      .select({ id: services.id })
      .from(services)
      .where(and(eq(services.id, data.serviceId), eq(services.businessId, businessId), eq(services.isActive, true)))
      .limit(1),
    db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.id, data.locationId), eq(locations.businessId, businessId), eq(locations.isActive, true)))
      .limit(1),
  ]);

  if (!service) {
    return NextResponse.json({ error: "Service not found." }, { status: 404 });
  }
  if (!location) {
    return NextResponse.json({ error: "Location not found." }, { status: 404 });
  }

  if (data.staffId) {
    const [staffMember] = await db
      .select({ id: staff.id })
      .from(staff)
      .innerJoin(staffServices, eq(staffServices.staffId, staff.id))
      .where(and(
        eq(staff.id, data.staffId),
        eq(staff.businessId, businessId),
        eq(staff.isActive, true),
        eq(staffServices.serviceId, data.serviceId),
      ))
      .limit(1);
    if (!staffMember) {
      return NextResponse.json({ error: "Staff member cannot perform this service." }, { status: 400 });
    }
  }

  const [deal] = await db
    .insert(deals)
    .values({
      businessId,
      locationId: data.locationId,
      serviceId: data.serviceId,
      staffId: data.staffId ?? null,
      discountPercent: data.discountPercent,
      slotsTotal: data.slotsTotal,
      dealWindowStart: new Date(data.dealWindowStart),
      dealWindowEnd: new Date(data.dealWindowEnd),
      apptWindowStart: new Date(data.apptWindowStart),
      apptWindowEnd: new Date(data.apptWindowEnd),
      status: "active",
    })
    .returning({ id: deals.id });

  void logActivity({
    businessId,
    entity: "deal",
    entityId: deal.id,
    action: "created",
    meta: {
      serviceId: data.serviceId,
      discountPercent: data.discountPercent,
      slotsTotal: data.slotsTotal,
    },
  }).catch((error) => {
    console.error("Activity log write failed:", error);
  });

  const [business] = await db
    .select({ directoryListed: businesses.directoryListed })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  return NextResponse.json({
    id: deal.id,
    directoryListed: business?.directoryListed ?? false,
  }, { status: 201 });
}
