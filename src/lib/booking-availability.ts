import { and, eq, gte, lt, ne } from "drizzle-orm";
import { endOfDay, format, parseISO, startOfDay } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { db } from "@/db";
import { availability, availabilityOverrides, bookings } from "@/db/schema";
import { getAvailableSlots } from "@/lib/availability";

const DEFAULT_TIMEZONE = "Asia/Colombo";

/**
 * Server-side check that a requested appointment start is genuinely an
 * available slot for the given staff member — inside working hours, not on a
 * blocked day, respecting the service's minimum notice, not in the past, and
 * not overlapping another active booking.
 *
 * Mirrors the slot logic used by the public availability endpoint
 * (`/api/availability`) so untrusted callers can't drive booking creation or
 * client reschedules outside the times the booking UI actually offers.
 *
 * Note: business-wide holidays (`business_holidays`) are intentionally not
 * considered here — they are not factored into slot generation anywhere in the
 * booking path today, so enforcing them is a separate change.
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
  /** Exclude this booking from overlap checks (used when rescheduling). */
  excludeBookingId?: string;
}): Promise<boolean> {
  const timezone = input.timezone || DEFAULT_TIMEZONE;
  const dateStr = format(toZonedTime(input.start, timezone), "yyyy-MM-dd");
  const localDate = parseISO(dateStr);
  const dayStartUtc = fromZonedTime(startOfDay(localDate), timezone);
  const dayEndUtc = fromZonedTime(endOfDay(localDate), timezone);

  const [staffAvailability, overrides, existingBookings] = await Promise.all([
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
      .where(
        and(
          eq(bookings.staffId, input.staffId),
          gte(bookings.startsAt, dayStartUtc),
          lt(bookings.startsAt, dayEndUtc),
          ...(input.excludeBookingId ? [ne(bookings.id, input.excludeBookingId)] : []),
        ),
      ),
  ]);

  const slots = getAvailableSlots({
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

  return slots.some((slot) => slot.startUtc.getTime() === input.start.getTime());
}
