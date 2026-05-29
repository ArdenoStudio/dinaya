import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { locations, services, staff, staffLocations, staffServices } from "@/db/schema";
import { and, count, eq, inArray } from "drizzle-orm";
import { PlanLimitError, requirePlanLimit } from "@/lib/plan";
import { requireApiBusiness } from "@/lib/api-auth";
import {
  getStaffDashboardList,
  isDashboardStaffStatusFilter,
  type DashboardStaffStatusFilter,
} from "@/lib/dashboard/staff";
import { z } from "@/lib/validation";

const staffCreateSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(100),
  bio: z.string().trim().max(1000).optional().nullable(),
  serviceIds: z.array(z.uuid()).optional().default([]),
  locationIds: z.array(z.uuid()).optional().default([]),
});

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

function parseLimit(value: string | null): number {
  const parsed = Number(value ?? DEFAULT_LIMIT);
  if (!Number.isFinite(parsed)) return DEFAULT_LIMIT;
  return Math.min(MAX_LIMIT, Math.max(1, Math.round(parsed)));
}

export async function GET(req: NextRequest) {
  const authResult = await requireApiBusiness({ req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const params = req.nextUrl.searchParams;
  const statusParam = params.get("status");
  if (statusParam && !isDashboardStaffStatusFilter(statusParam)) {
    return NextResponse.json({ error: "status is invalid." }, { status: 400 });
  }

  const { rows } = await getStaffDashboardList(businessId, {
    limit: parseLimit(params.get("limit")),
    q: params.get("q")?.trim() ?? "",
    status: (statusParam || "all") as DashboardStaffStatusFilter,
  });

  return NextResponse.json(rows);
}

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId } = authResult.context;

  const parsed = staffCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the staff details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  const { name, bio } = parsed.data;
  const serviceIds = Array.from(new Set(parsed.data.serviceIds));
  const locationIds = Array.from(new Set(parsed.data.locationIds));

  const [{ value: staffCount }] = await db
    .select({ value: count() })
    .from(staff)
    .where(eq(staff.businessId, businessId));
  try {
    await requirePlanLimit(businessId, "staff", Number(staffCount));
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json({ error: "Free businesses can add 1 staff member. Upgrade to Pro for more staff." }, { status: 402 });
    }
    throw error;
  }

  if (serviceIds.length > 0) {
    const validServices = await db
      .select({ id: services.id })
      .from(services)
      .where(and(eq(services.businessId, businessId), inArray(services.id, serviceIds)));

    if (validServices.length !== serviceIds.length) {
      return NextResponse.json({ error: "One or more services are invalid." }, { status: 400 });
    }
  }

  if (locationIds.length > 0) {
    const validLocations = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.businessId, businessId), inArray(locations.id, locationIds)));

    if (validLocations.length !== locationIds.length) {
      return NextResponse.json({ error: "One or more locations are invalid." }, { status: 400 });
    }
  }

  const [created] = await db
    .insert(staff)
    .values({ businessId, name, bio: bio || null })
    .returning({ id: staff.id });

  if (serviceIds.length > 0) {
    await db.insert(staffServices).values(
      serviceIds.map((serviceId) => ({ staffId: created.id, serviceId }))
    );
  }

  if (locationIds.length > 0) {
    await db.insert(staffLocations).values(
      locationIds.map((locationId, index) => ({
        staffId: created.id,
        locationId,
        isPrimary: index === 0,
      }))
    );
  } else {
    const [defaultLoc] = await db
      .select({ id: locations.id })
      .from(locations)
      .where(and(eq(locations.businessId, businessId), eq(locations.isDefault, true)))
      .limit(1);
    if (defaultLoc) {
      await db.insert(staffLocations).values({
        staffId: created.id,
        locationId: defaultLoc.id,
        isPrimary: true,
      });
    }
  }

  return NextResponse.json({ id: created.id }, { status: 201 });
}
