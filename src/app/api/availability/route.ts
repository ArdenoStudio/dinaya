import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { availability, availabilityOverrides, bookings, businesses, staff, services } from "@/db/schema";
import { eq, and, gte, lt, count } from "drizzle-orm";
import { getAvailableSlots } from "@/lib/availability";
import { parseISO, startOfDay, endOfDay } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const DEFAULT_TIMEZONE = "Asia/Colombo";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const staffId = searchParams.get("staffId");
  const serviceId = searchParams.get("serviceId");
  const businessId = searchParams.get("businessId");
  const date = searchParams.get("date"); // "YYYY-MM-DD" in Colombo time

  if (!staffId || !serviceId || !date) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const [service] = await db
    .select({
      durationMinutes: services.durationMinutes,
      beforeBuffer: services.beforeBuffer,
      businessId: services.businessId,
      afterBuffer: services.afterBuffer,
      minimumNoticeHours: services.minimumNoticeHours,
      dailyCapacity: services.dailyCapacity,
    })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (!service) return NextResponse.json({ slots: [] });

  const [staffMember] = await db
    .select({ businessId: staff.businessId, isActive: staff.isActive })
    .from(staff)
    .where(eq(staff.id, staffId))
    .limit(1);

  if (
    !staffMember ||
    !staffMember.isActive ||
    staffMember.businessId !== service.businessId ||
    (businessId && businessId !== service.businessId)
  ) {
    return NextResponse.json({ slots: [] }, { status: 404 });
  }

  const [business] = await db
    .select({ timezone: businesses.timezone })
    .from(businesses)
    .where(eq(businesses.id, service.businessId))
    .limit(1);
  const timezone = business?.timezone ?? DEFAULT_TIMEZONE;

  const staffAvailability = await db
    .select()
    .from(availability)
    .where(eq(availability.staffId, staffId));

  const overrides = await db
    .select()
    .from(availabilityOverrides)
    .where(and(eq(availabilityOverrides.staffId, staffId), eq(availabilityOverrides.date, date)));

  // Get existing bookings for this day (UTC window)
  const localDate = parseISO(date);
  const dayStartUtc = fromZonedTime(startOfDay(localDate), timezone);
  const dayEndUtc = fromZonedTime(endOfDay(localDate), timezone);

  const existingBookings = await db
    .select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt, status: bookings.status })
    .from(bookings)
    .where(
      and(
        eq(bookings.staffId, staffId),
        gte(bookings.startsAt, dayStartUtc),
        lt(bookings.startsAt, dayEndUtc)
      )
    );

  // Check daily capacity — if limit reached, no slots available
  if (service.dailyCapacity != null) {
    const [{ value: bookedCount }] = await db
      .select({ value: count() })
      .from(bookings)
      .where(
        and(
          eq(bookings.staffId, staffId),
          eq(bookings.serviceId, serviceId),
          gte(bookings.startsAt, dayStartUtc),
          lt(bookings.startsAt, dayEndUtc),
          and(
            eq(bookings.status, "confirmed"),
          )
        )
      );
    if (Number(bookedCount) >= service.dailyCapacity) {
      return NextResponse.json({ slots: [], capacityReached: true });
    }
  }

  const slots = getAvailableSlots({
    date,
    durationMinutes: service.durationMinutes,
    beforeBuffer: service.beforeBuffer ?? 0,
    afterBuffer: service.afterBuffer ?? 0,
    minimumNoticeHours: service.minimumNoticeHours ?? 0,
    staffAvailability,
    overrides,
    existingBookings,
    timezone,
  });

  return NextResponse.json({
    slots: slots.map((s) => ({
      startUtc: s.startUtc.toISOString(),
      endUtc: s.endUtc.toISOString(),
      label: s.label,
    })),
  });
}
