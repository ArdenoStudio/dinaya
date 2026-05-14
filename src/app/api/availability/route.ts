import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { availability, availabilityOverrides, bookings, staff, services } from "@/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { getAvailableSlots } from "@/lib/availability";
import { parseISO, startOfDay, endOfDay } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const COLOMBO_TZ = "Asia/Colombo";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const staffId = searchParams.get("staffId");
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date"); // "YYYY-MM-DD" in Colombo time

  if (!staffId || !serviceId || !date) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const [service] = await db
    .select({
      durationMinutes: services.durationMinutes,
      beforeBuffer: services.beforeBuffer,
      afterBuffer: services.afterBuffer,
      minimumNoticeHours: services.minimumNoticeHours,
    })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (!service) return NextResponse.json({ slots: [] });

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
  const dayStartUtc = fromZonedTime(startOfDay(localDate), COLOMBO_TZ);
  const dayEndUtc = fromZonedTime(endOfDay(localDate), COLOMBO_TZ);

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

  const slots = getAvailableSlots({
    date,
    durationMinutes: service.durationMinutes,
    beforeBuffer: service.beforeBuffer ?? 0,
    afterBuffer: service.afterBuffer ?? 0,
    minimumNoticeHours: service.minimumNoticeHours ?? 0,
    staffAvailability,
    overrides,
    existingBookings,
  });

  return NextResponse.json({
    slots: slots.map((s) => ({
      startUtc: s.startUtc.toISOString(),
      endUtc: s.endUtc.toISOString(),
      label: s.label,
    })),
  });
}
