import { NextRequest, NextResponse } from "next/server";
import { and, eq, gte, inArray, lt } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import {
  availability,
  availabilityOverrides,
  bookings,
  services,
  staff,
  staffLocations,
} from "@/db/schema";
import { hasApiKeyAuth, requireApiBusiness } from "@/lib/api-auth";

function parseStaffIds(req: NextRequest): string[] {
  const params = req.nextUrl.searchParams;
  const repeated = params.getAll("staffIds[]");
  const comma = params.get("staffIds");
  return [...repeated, ...(comma ? comma.split(",") : [])].map((id) => id.trim()).filter(Boolean);
}

export async function GET(req: NextRequest) {
  const apiAuth = await requireApiBusiness({
    req,
    apiKeyScope: "bookings:read",
  });
  let businessId: string | undefined;
  if (apiAuth.ok) {
    businessId = apiAuth.context.businessId;
  } else {
    if (hasApiKeyAuth(req)) {
      return apiAuth.response;
    }

    const session = await auth();
    if (!session?.user?.businessId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    businessId = session.user.businessId;
  }

  const fromParam = req.nextUrl.searchParams.get("from");
  const toParam = req.nextUrl.searchParams.get("to");

  if (!fromParam || !toParam) {
    return NextResponse.json({ error: "from and to are required." }, { status: 400 });
  }

  const from = new Date(fromParam);
  const to = new Date(toParam);

  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || to <= from) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }

  const requestedStaffIds = parseStaffIds(req);
  const locationId = req.nextUrl.searchParams.get("locationId")?.trim() || null;

  let staffFilter = eq(staff.businessId, businessId);
  if (requestedStaffIds.length > 0) {
    staffFilter = and(staffFilter, inArray(staff.id, requestedStaffIds))!;
  }

  if (locationId) {
    const atLocation = await db
      .select({ staffId: staffLocations.staffId })
      .from(staffLocations)
      .where(eq(staffLocations.locationId, locationId));
    const ids = atLocation.map((row) => row.staffId);
    if (ids.length === 0) {
      return NextResponse.json({ staff: [], bookings: [], availability: [], overrides: [] });
    }
    staffFilter = and(staffFilter, inArray(staff.id, ids))!;
  }

  const staffRows = await db
    .select({ id: staff.id, name: staff.name })
    .from(staff)
    .where(staffFilter);

  const staffIds = staffRows.map((row) => row.id);

  if (staffIds.length === 0) {
    return NextResponse.json({ staff: [], bookings: [], availability: [], overrides: [] });
  }

  const bookingRows = await db
    .select({
      id: bookings.id,
      clientId: bookings.clientId,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      endsAt: bookings.endsAt,
      serviceId: bookings.serviceId,
      serviceName: services.name,
      source: bookings.source,
      staffId: bookings.staffId,
      startsAt: bookings.startsAt,
      status: bookings.status,
    })
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .where(
      and(
        eq(bookings.businessId, businessId),
        inArray(bookings.staffId, staffIds),
        gte(bookings.startsAt, from),
        lt(bookings.startsAt, to)
      )
    );

  const availabilityRows = await db
    .select()
    .from(availability)
    .where(inArray(availability.staffId, staffIds));

  const overrideRows = await db
    .select()
    .from(availabilityOverrides)
    .where(inArray(availabilityOverrides.staffId, staffIds));

  return NextResponse.json({
    staff: staffRows,
    bookings: bookingRows,
    availability: availabilityRows,
    overrides: overrideRows,
  });
}
