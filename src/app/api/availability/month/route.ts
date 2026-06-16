import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  availability,
  availabilityOverrides,
  bookings,
  businesses,
  services,
  staff,
} from "@/db/schema";
import { getDealById } from "@/lib/deals/queries";
import { eq, and, gte, lt, count, inArray } from "drizzle-orm";
import { getAvailableSlots, isStaffClosedOnDate } from "@/lib/availability";
import { getActiveReservationsForStaff } from "@/lib/slot-reservations";
import { withRateLimit } from "@/lib/rate-limit";
import {
  addDays,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  format,
  parseISO,
  startOfDay,
} from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

const DEFAULT_TIMEZONE = "Asia/Colombo";

export type MonthDayStatus = "available" | "full" | "closed";

export async function GET(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "availability",
    limit: 60,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const { searchParams } = req.nextUrl;
  const staffId = searchParams.get("staffId");
  const serviceId = searchParams.get("serviceId");
  const businessId = searchParams.get("businessId");
  const month = searchParams.get("month"); // "YYYY-MM"
  const dealId = searchParams.get("dealId");
  const sessionToken = searchParams.get("sessionToken");

  if (!staffId || !serviceId || !month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const [service] = await db
    .select({
      durationMinutes: services.durationMinutes,
      beforeBuffer: services.beforeBuffer,
      afterBuffer: services.afterBuffer,
      businessId: services.businessId,
      minimumNoticeHours: services.minimumNoticeHours,
      dailyCapacity: services.dailyCapacity,
      maximumAdvanceDays: services.maximumAdvanceDays,
    })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (!service) return NextResponse.json({ days: {} });

  const [[staffMember], [business]] = await Promise.all([
    db
      .select({ businessId: staff.businessId, isActive: staff.isActive })
      .from(staff)
      .where(eq(staff.id, staffId))
      .limit(1),
    db
      .select({ timezone: businesses.timezone })
      .from(businesses)
      .where(eq(businesses.id, service.businessId))
      .limit(1),
  ]);

  if (
    !staffMember ||
    !staffMember.isActive ||
    staffMember.businessId !== service.businessId ||
    (businessId && businessId !== service.businessId)
  ) {
    return NextResponse.json({ days: {} }, { status: 404 });
  }

  const timezone = business?.timezone ?? DEFAULT_TIMEZONE;
  const monthStart = parseISO(`${month}-01`);
  const monthEnd = endOfMonth(monthStart);
  const today = toZonedTime(new Date(), timezone);
  const earliestDay = startOfDay(today);
  const latestDay =
    service.maximumAdvanceDays && service.maximumAdvanceDays > 0
      ? addDays(today, service.maximumAdvanceDays)
      : null;

  const rangeStart = earliestDay > monthStart ? earliestDay : monthStart;
  const rangeEnd = latestDay && latestDay < monthEnd ? latestDay : monthEnd;
  if (rangeStart > rangeEnd) {
    return NextResponse.json({ days: {} });
  }

  const daysInRange = eachDayOfInterval({ start: rangeStart, end: rangeEnd });
  const dateStrings = daysInRange.map((d) => format(d, "yyyy-MM-dd"));

  const [staffAvailability, monthOverrides, deal] = await Promise.all([
    db.select().from(availability).where(eq(availability.staffId, staffId)),
    db
      .select()
      .from(availabilityOverrides)
      .where(
        and(
          eq(availabilityOverrides.staffId, staffId),
          inArray(availabilityOverrides.date, dateStrings),
        ),
      ),
    dealId ? getDealById(dealId) : Promise.resolve(null),
  ]);

  const overridesByDate = new Map(monthOverrides.map((o) => [o.date, o]));
  const days: Record<string, MonthDayStatus> = {};

  for (const date of dateStrings) {
    const overrides = overridesByDate.has(date) ? [overridesByDate.get(date)!] : [];

    if (isStaffClosedOnDate({ date, staffAvailability, overrides })) {
      days[date] = "closed";
      continue;
    }

    const localDate = parseISO(date);
    const dayStartUtc = fromZonedTime(startOfDay(localDate), timezone);
    const dayEndUtc = fromZonedTime(endOfDay(localDate), timezone);

    if (service.dailyCapacity != null) {
      const [capacityRow] = await db
        .select({ value: count() })
        .from(bookings)
        .where(
          and(
            eq(bookings.staffId, staffId),
            eq(bookings.serviceId, serviceId),
            gte(bookings.startsAt, dayStartUtc),
            lt(bookings.startsAt, dayEndUtc),
            eq(bookings.status, "confirmed"),
          ),
        );

      if (capacityRow && Number(capacityRow.value) >= service.dailyCapacity) {
        days[date] = "full";
        continue;
      }
    }

    const [existingBookings, reservations] = await Promise.all([
      db
        .select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt, status: bookings.status })
        .from(bookings)
        .where(
          and(
            eq(bookings.staffId, staffId),
            gte(bookings.startsAt, dayStartUtc),
            lt(bookings.startsAt, dayEndUtc),
          ),
        ),
      getActiveReservationsForStaff(staffId, dayStartUtc, dayEndUtc, sessionToken ?? undefined),
    ]);

    const blockedReservations = reservations.map((r) => ({
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      status: "confirmed" as const,
    }));

    let slots = getAvailableSlots({
      date,
      durationMinutes: service.durationMinutes,
      beforeBuffer: service.beforeBuffer ?? 0,
      afterBuffer: service.afterBuffer ?? 0,
      minimumNoticeHours: service.minimumNoticeHours ?? 0,
      maximumAdvanceDays: service.maximumAdvanceDays ?? 0,
      staffAvailability,
      overrides,
      existingBookings: [...existingBookings, ...blockedReservations],
      timezone,
    });

    if (deal) {
      slots = slots.filter(
        (slot) => slot.startUtc >= deal.apptWindowStart && slot.startUtc <= deal.apptWindowEnd,
      );
    }

    days[date] = slots.length > 0 ? "available" : "full";
  }

  return NextResponse.json({ days });
}
