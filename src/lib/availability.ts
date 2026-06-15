import { addDays, addMinutes, format, parseISO, setHours, setMinutes, startOfDay } from "date-fns";
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import type { Availability, AvailabilityOverride, Booking } from "@/db/schema";

const DEFAULT_TIMEZONE = "Asia/Colombo";
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
  beforeBuffer = 0,
  afterBuffer = 0,
  minimumNoticeHours = 0,
  maximumAdvanceDays = 0,
  staffAvailability,
  overrides,
  existingBookings,
  timezone = DEFAULT_TIMEZONE,
}: {
  date: string; // "YYYY-MM-DD" in Colombo time
  durationMinutes: number;
  /** Minutes to block before the appointment starts */
  beforeBuffer?: number;
  /** Minutes to block after the appointment ends */
  afterBuffer?: number;
  /** Slots starting sooner than this many hours from now are hidden */
  minimumNoticeHours?: number;
  /** Slots starting later than this many days from now are hidden. 0 = no limit. */
  maximumAdvanceDays?: number;
  staffAvailability: Availability[];
  overrides: AvailabilityOverride[];
  existingBookings: Pick<Booking, "startsAt" | "endsAt" | "status">[];
  timezone?: string;
}): TimeSlot[] {
  // Check for a full-day block override
  const dayOverride = overrides.find((o) => o.date === date);
  if (dayOverride?.isBlocked && !dayOverride.startTime) return [];

  // Find the recurring availability for this day of week. Multiple rows allow split shifts.
  const localDate = parseISO(date);
  const dayOfWeek = localDate.getDay(); // 0=Sun, ..., 6=Sat
  const recurringSlots = staffAvailability.filter((a) => a.dayOfWeek === dayOfWeek);

  if (recurringSlots.length === 0 && !dayOverride?.startTime) return [];

  const localDayStart = startOfDay(localDate);
  const workingWindows = dayOverride?.startTime && dayOverride.endTime
    ? [{ startTime: dayOverride.startTime, endTime: dayOverride.endTime }]
    : recurringSlots.map((slot) => ({ startTime: slot.startTime, endTime: slot.endTime }));

  // Filter to only confirmed/pending bookings (not cancelled)
  const activeBookings = existingBookings.filter(
    (b) => b.status === "confirmed" || b.status === "pending"
  );

  // Earliest bookable moment based on minimum notice
  const earliestBookable = minimumNoticeHours > 0
    ? addMinutes(new Date(), minimumNoticeHours * 60)
    : null;

  // Latest bookable moment based on the rolling future-booking window
  const latestBookable = maximumAdvanceDays > 0
    ? addDays(new Date(), maximumAdvanceDays)
    : null;

  const slots: TimeSlot[] = [];

  for (const window of workingWindows) {
    const { hours: startH, minutes: startM } = parseTime(window.startTime);
    const { hours: endH, minutes: endM } = parseTime(window.endTime);
    const windowStartLocal = setMinutes(setHours(localDayStart, startH), startM);
    const windowEndLocal = setMinutes(setHours(localDayStart, endH), endM);
    const windowStartUtc = fromZonedTime(windowStartLocal, timezone);
    const windowEndUtc = fromZonedTime(windowEndLocal, timezone);
    let cursor = windowStartUtc;

    while (cursor < windowEndUtc) {
      const slotEnd = addMinutes(cursor, durationMinutes);
      if (slotEnd > windowEndUtc) break;

      // cursor only increases, so once we pass the window everything after is too far out.
      if (latestBookable && cursor > latestBookable) break;

      if (earliestBookable && cursor < earliestBookable) {
        cursor = addMinutes(cursor, SLOT_INTERVAL_MINUTES);
        continue;
      }

      const blockedStart = addMinutes(cursor, -beforeBuffer);
      const blockedEnd = addMinutes(slotEnd, afterBuffer);

      const overlaps = activeBookings.some((b) =>
        slotsOverlap(blockedStart, blockedEnd, new Date(b.startsAt), new Date(b.endsAt))
      );

      if (!overlaps) {
        const localStart = toZonedTime(cursor, timezone);
        slots.push({
          startUtc: cursor,
          endUtc: slotEnd,
          startLocal: format(localStart, "HH:mm"),
          label: format(localStart, "h:mm a"),
        });
      }

      cursor = addMinutes(cursor, SLOT_INTERVAL_MINUTES);
    }
  }

  return slots.sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());
}
