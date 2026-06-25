import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  availability,
  availabilityOverrides,
  bookings,
  businesses,
  staff,
  services,
} from "@/db/schema";
import { getDealById } from "@/lib/deals/queries";
import { eq, and, gte, lt, count } from "drizzle-orm";
import { getAvailableSlots, isStaffClosedOnDate } from "@/lib/availability";
import { getMergedSlotsForStaff, listEligibleStaffIdsForService } from "@/lib/availability-staff";
import {
  filterSlotsByBusinessHoliday,
  getBusinessHolidayForDate,
  isBusinessHolidayClosed,
} from "@/lib/business-holidays";
import { ANY_STAFF_ID } from "@/lib/booking-staff";
import { getActiveReservationsForStaff } from "@/lib/slot-reservations";
import { withRateLimit } from "@/lib/rate-limit";
import { parseISO, startOfDay, endOfDay } from "date-fns";
import { fromZonedTime } from "date-fns-tz";

const DEFAULT_TIMEZONE = "Asia/Colombo";

export async function GET(req: NextRequest) {
  const limited = await withRateLimit(req, {
    scope: "availability",
    limit: 120,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const { searchParams } = req.nextUrl;
  const staffId = searchParams.get("staffId");
  const serviceId = searchParams.get("serviceId");
  const businessId = searchParams.get("businessId");
  const locationId = searchParams.get("locationId");
  const date = searchParams.get("date");
  const dealId = searchParams.get("dealId");
  const sessionToken = searchParams.get("sessionToken");

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
      maximumAdvanceDays: services.maximumAdvanceDays,
    })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (!service) return NextResponse.json({ slots: [] });

  const [business] = await db
    .select({ timezone: businesses.timezone })
    .from(businesses)
    .where(eq(businesses.id, service.businessId))
    .limit(1);

  const timezone = business?.timezone ?? DEFAULT_TIMEZONE;

  if (businessId && businessId !== service.businessId) {
    return NextResponse.json({ slots: [] }, { status: 404 });
  }

  if (staffId === ANY_STAFF_ID) {
    const eligibleIds = await listEligibleStaffIdsForService(
      service.businessId,
      serviceId,
      locationId,
    );

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
      locationId,
      sessionToken: sessionToken ?? undefined,
    });

    let slots = merged.slots;
    if (dealId) {
      const deal = await getDealById(dealId);
      if (deal) {
        slots = slots.filter(
          (slot) => slot.startUtc >= deal.apptWindowStart && slot.startUtc <= deal.apptWindowEnd,
        );
      }
    }

    return NextResponse.json({
      slots: slots.map((slot) => ({
        startUtc: slot.startUtc.toISOString(),
        endUtc: slot.endUtc.toISOString(),
        label: slot.label,
        staffId: slot.staffId,
      })),
      closed: merged.closed,
      capacityReached: merged.capacityReached,
    });
  }

  const [[staffMember], holiday] = await Promise.all([
    db
      .select({ businessId: staff.businessId, isActive: staff.isActive })
      .from(staff)
      .where(eq(staff.id, staffId))
      .limit(1),
    getBusinessHolidayForDate({
      businessId: service.businessId,
      date,
      locationId,
    }),
  ]);

  if (!staffMember || !staffMember.isActive || staffMember.businessId !== service.businessId) {
    return NextResponse.json({ slots: [] }, { status: 404 });
  }

  if (isBusinessHolidayClosed(holiday)) {
    return NextResponse.json({ slots: [], closed: true, capacityReached: false });
  }

  const localDate = parseISO(date);
  const dayStartUtc = fromZonedTime(startOfDay(localDate), timezone);
  const dayEndUtc = fromZonedTime(endOfDay(localDate), timezone);

  const dayBookingsFilter = and(
    eq(bookings.staffId, staffId),
    gte(bookings.startsAt, dayStartUtc),
    lt(bookings.startsAt, dayEndUtc),
  );

  const [staffAvailability, overrides, existingBookings, capacityRow, reservations] =
    await Promise.all([
      db.select().from(availability).where(eq(availability.staffId, staffId)),
      db
        .select()
        .from(availabilityOverrides)
        .where(and(eq(availabilityOverrides.staffId, staffId), eq(availabilityOverrides.date, date))),
      db
        .select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt, status: bookings.status })
        .from(bookings)
        .where(dayBookingsFilter),
      service.dailyCapacity != null
        ? db
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
            )
            .then(([row]) => row)
        : Promise.resolve(null),
      getActiveReservationsForStaff(staffId, dayStartUtc, dayEndUtc, sessionToken ?? undefined),
    ]);

  if (
    service.dailyCapacity != null &&
    capacityRow &&
    Number(capacityRow.value) >= service.dailyCapacity
  ) {
    return NextResponse.json({ slots: [], capacityReached: true, closed: false });
  }

  const closed = isStaffClosedOnDate({
    date,
    staffAvailability,
    overrides,
  });

  if (closed) {
    return NextResponse.json({ slots: [], closed: true, capacityReached: false });
  }

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

  slots = filterSlotsByBusinessHoliday(slots, holiday, timezone);

  if (dealId) {
    const deal = await getDealById(dealId);
    if (deal) {
      slots = slots.filter(
        (slot) => slot.startUtc >= deal.apptWindowStart && slot.startUtc <= deal.apptWindowEnd,
      );
    }
  }

  return NextResponse.json({
    slots: slots.map((s) => ({
      startUtc: s.startUtc.toISOString(),
      endUtc: s.endUtc.toISOString(),
      label: s.label,
      staffId,
    })),
    closed: false,
    capacityReached: false,
  });
}
