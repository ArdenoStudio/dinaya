import { addMinutes, format, parseISO, isWithinInterval, setHours, setMinutes, startOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import type { Availability, AvailabilityOverride, Booking } from "@/db/schema";

const COLOMBO_TZ = "Asia/Colombo";
const SLOT_INTERVAL_MINUTES = 15;

export interface TimeSlot {
  startUtc: Date;
  endUtc: Date;
  startLocal: string; // "09:00"
  label: string;      // "9:00 AM"
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours, minutes };
}

function slotsOverlap(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export function getAvailableSlots({
  date,
  durationMinutes,
  staffAvailability,
  overrides,
  existingBookings,
}: {
  date: string; // "YYYY-MM-DD" in Colombo time
  durationMinutes: number;
  staffAvailability: Availability[];
  overrides: AvailabilityOverride[];
  existingBookings: Pick<Booking, "startsAt" | "endsAt" | "status">[];
}): TimeSlot[] {
  // Check for a full-day block override
  const dayOverride = overrides.find((o) => o.date === date);
  if (dayOverride?.isBlocked && !dayOverride.startTime) return [];

  // Find the recurring availability for this day of week
  const localDate = parseISO(date);
  const dayOfWeek = localDate.getDay(); // 0=Sun, ..., 6=Sat
  const recurringSlot = staffAvailability.find((a) => a.dayOfWeek === dayOfWeek);

  if (!recurringSlot) return [];

  // Determine effective working hours (override may narrow them)
  const workStart = dayOverride?.startTime ?? recurringSlot.startTime;
  const workEnd = dayOverride?.endTime ?? recurringSlot.endTime;

  const { hours: startH, minutes: startM } = parseTime(workStart);
  const { hours: endH, minutes: endM } = parseTime(workEnd);

  // Build the working window in UTC
  const localDayStart = startOfDay(localDate);
  const windowStartLocal = setMinutes(setHours(localDayStart, startH), startM);
  const windowEndLocal = setMinutes(setHours(localDayStart, endH), endM);
  const windowStartUtc = fromZonedTime(windowStartLocal, COLOMBO_TZ);
  const windowEndUtc = fromZonedTime(windowEndLocal, COLOMBO_TZ);

  // Filter to only confirmed/pending bookings (not cancelled)
  const activeBookings = existingBookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending"
  );

  const slots: TimeSlot[] = [];
  let cursor = windowStartUtc;

  while (cursor < windowEndUtc) {
    const slotEnd = addMinutes(cursor, durationMinutes);
    if (slotEnd > windowEndUtc) break;

    const overlaps = activeBookings.some((b) =>
      slotsOverlap(cursor, slotEnd, new Date(b.startsAt), new Date(b.endsAt))
    );

    if (!overlaps) {
      const localStart = toZonedTime(cursor, COLOMBO_TZ);
      slots.push({
        startUtc: cursor,
        endUtc: slotEnd,
        startLocal: format(localStart, "HH:mm"),
        label: format(localStart, "h:mm a"),
      });
    }

    cursor = addMinutes(cursor, SLOT_INTERVAL_MINUTES);
  }

  return slots;
}
