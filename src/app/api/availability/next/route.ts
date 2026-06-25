import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { availability, availabilityOverrides, bookings, businesses, services, staff } from "@/db/schema";
import { eq, and, gte, lt, count } from "drizzle-orm";
import { addDays, format, parseISO, startOfDay, endOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { getAvailableSlots } from "@/lib/availability";
import { getMergedSlotsForStaff, listEligibleStaffIdsForService } from "@/lib/availability-staff";
import { ANY_STAFF_ID } from "@/lib/booking-staff";
import { getActiveReservationsForStaff } from "@/lib/slot-reservations";
import { withRateLimit } from "@/lib/rate-limit";

const DEFAULT_TIMEZONE = "Asia/Colombo";
const MAX_SCAN_DAYS = 21;

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
  const sessionToken = searchParams.get("sessionToken");

  if (!staffId || !serviceId) {
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

  if (!service) return NextResponse.json({ next: null });

  const [[staffMember], [business]] = await Promise.all([
    staffId === ANY_STAFF_ID
      ? Promise.resolve([{ businessId: service.businessId, isActive: true }])
      : db
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
    return NextResponse.json({ next: null }, { status: 404 });
  }

  const timezone = business?.timezone ?? DEFAULT_TIMEZONE;
  const today = toZonedTime(new Date(), timezone);
  const maxDays = service.maximumAdvanceDays
    ? Math.min(service.maximumAdvanceDays, MAX_SCAN_DAYS)
    : MAX_SCAN_DAYS;

  if (staffId === ANY_STAFF_ID) {
    const eligibleIds = await listEligibleStaffIdsForService(
      service.businessId,
      serviceId,
      searchParams.get("locationId"),
    );

    for (let offset = 0; offset <= maxDays; offset += 1) {
      const day = addDays(today, offset);
      const date = format(day, "yyyy-MM-dd");
      const merged = await getMergedSlotsForStaff({
        staffIds: eligibleIds,
        businessId: service.businessId,
        serviceId,
        date,
        durationMinutes: service.durationMinutes,
        beforeBuffer: service.beforeBuffer ?? 0,
        afterBuffer: service.afterBuffer ?? 0,
        minimumNoticeHours: service.minimumNoticeHours ?? 0,
        maximumAdvanceDays: service.maximumAdvanceDays ?? 0,
        dailyCapacity: service.dailyCapacity,
        timezone,
        locationId: searchParams.get("locationId"),
        sessionToken: sessionToken ?? undefined,
      });

      if (merged.slots.length > 0) {
        const first = merged.slots[0]!;
        return NextResponse.json({
          next: {
            date,
            startUtc: first.startUtc.toISOString(),
            endUtc: first.endUtc.toISOString(),
            label: first.label,
          },
        });
      }
    }

    return NextResponse.json({ next: null });
  }

  const staffAvailability = await db
    .select()
    .from(availability)
    .where(eq(availability.staffId, staffId));

  for (let offset = 0; offset <= maxDays; offset += 1) {
    const day = addDays(today, offset);
    const date = format(day, "yyyy-MM-dd");
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
        continue;
      }
    }

    const [overrides, existingBookings, reservations] = await Promise.all([
      db
        .select()
        .from(availabilityOverrides)
        .where(and(eq(availabilityOverrides.staffId, staffId), eq(availabilityOverrides.date, date))),
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

    const slots = getAvailableSlots({
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

    if (slots.length > 0) {
      const first = slots[0]!;
      return NextResponse.json({
        next: {
          date,
          startUtc: first.startUtc.toISOString(),
          endUtc: first.endUtc.toISOString(),
          label: first.label,
        },
      });
    }
  }

  return NextResponse.json({ next: null });
}
