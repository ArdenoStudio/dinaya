import { and, count, eq, gte, lt, ne, gt } from "drizzle-orm";
import { endOfDay, format, parseISO, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { db } from "@/db";
import { availability, availabilityOverrides, bookings } from "@/db/schema";
import { getAvailableSlots } from "@/lib/availability";
import {
  filterSlotsByBusinessHoliday,
  getBusinessHolidayForDate,
  isBusinessHolidayClosed,
} from "@/lib/business-holidays";

const DEFAULT_TIMEZONE = "Asia/Colombo";

/** Bookings that overlap a calendar day in the business timezone. */
export function bookingsOverlappingDayFilter(
  staffId: string,
  dayStartUtc: Date,
  dayEndUtc: Date,
  excludeBookingId?: string,
) {
  return and(
    eq(bookings.staffId, staffId),
    lt(bookings.startsAt, dayEndUtc),
    gt(bookings.endsAt, dayStartUtc),
    ...(excludeBookingId ? [ne(bookings.id, excludeBookingId)] : []),
  );
}

export async function isDailyCapacityReached(input: {
  staffId: string;
  serviceId: string;
  start: Date;
  timezone: string;
  dailyCapacity: number | null;
}): Promise<boolean> {
  if (input.dailyCapacity == null) return false;

  const dateStr = format(toZonedTime(input.start, input.timezone), "yyyy-MM-dd");
  const localDate = parseISO(dateStr);
  const dayStartUtc = fromZonedTime(startOfDay(localDate), input.timezone);
  const dayEndUtc = fromZonedTime(endOfDay(localDate), input.timezone);

  const [capacityRow] = await db
    .select({ value: count() })
    .from(bookings)
    .where(
      and(
        eq(bookings.staffId, input.staffId),
        eq(bookings.serviceId, input.serviceId),
        gte(bookings.startsAt, dayStartUtc),
        lt(bookings.startsAt, dayEndUtc),
        eq(bookings.status, "confirmed"),
      ),
    );

  return capacityRow != null && Number(capacityRow.value) >= input.dailyCapacity;
}

/**
 * Server-side check that a requested appointment start is genuinely an
 * available slot for the given staff member — inside working hours, not on a
 * blocked day, respecting business holidays, the service's minimum notice, not
 * in the past, and not overlapping another active booking.
 *
 * Mirrors the slot logic used by the public availability endpoint
 * (`/api/availability`) so untrusted callers can't drive booking creation or
 * client reschedules outside the times the booking UI actually offers.
 */
export async function isRequestedSlotAvailable(input: {
  staffId: string;
  start: Date;
  durationMinutes: number;
  beforeBuffer?: number;
  afterBuffer?: number;
  minimumNoticeHours?: number;
  maximumAdvanceDays?: number;
  timezone?: string;
  businessId?: string;
  locationId?: string | null;
  /** Exclude this booking from overlap checks (used when rescheduling). */
  excludeBookingId?: string;
}): Promise<boolean> {
  const timezone = input.timezone || DEFAULT_TIMEZONE;
  const dateStr = format(toZonedTime(input.start, timezone), "yyyy-MM-dd");
  const localDate = parseISO(dateStr);
  const dayStartUtc = fromZonedTime(startOfDay(localDate), timezone);
  const dayEndUtc = fromZonedTime(endOfDay(localDate), timezone);

  const holidayPromise =
    input.businessId
      ? getBusinessHolidayForDate({
          businessId: input.businessId,
          date: dateStr,
          locationId: input.locationId,
        })
      : Promise.resolve(null);

  const [staffAvailability, overrides, existingBookings, holiday] = await Promise.all([
    db.select().from(availability).where(eq(availability.staffId, input.staffId)),
    db
      .select()
      .from(availabilityOverrides)
      .where(
        and(
          eq(availabilityOverrides.staffId, input.staffId),
          eq(availabilityOverrides.date, dateStr),
        ),
      ),
    db
      .select({ startsAt: bookings.startsAt, endsAt: bookings.endsAt, status: bookings.status })
      .from(bookings)
      .where(bookingsOverlappingDayFilter(input.staffId, dayStartUtc, dayEndUtc, input.excludeBookingId)),
    holidayPromise,
  ]);

  if (isBusinessHolidayClosed(holiday)) {
    return false;
  }

  let slots = getAvailableSlots({
    date: dateStr,
    durationMinutes: input.durationMinutes,
    beforeBuffer: input.beforeBuffer ?? 0,
    afterBuffer: input.afterBuffer ?? 0,
    minimumNoticeHours: input.minimumNoticeHours ?? 0,
    maximumAdvanceDays: input.maximumAdvanceDays ?? 0,
    staffAvailability,
    overrides,
    existingBookings,
    timezone,
  });

  slots = filterSlotsByBusinessHoliday(slots, holiday, timezone);

  return slots.some((slot) => slot.startUtc.getTime() === input.start.getTime());
}
