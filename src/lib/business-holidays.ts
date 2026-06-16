import { and, eq, isNull, or } from "drizzle-orm";
import { parseISO, setHours, setMinutes, startOfDay } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { db } from "@/db";
import { businessHolidays, type BusinessHoliday } from "@/db/schema";
import type { TimeSlot } from "@/lib/availability";

function parseTime(timeStr: string): { hours: number; minutes: number } {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return { hours: hours ?? 0, minutes: minutes ?? 0 };
}

export async function getBusinessHolidayForDate(input: {
  businessId: string;
  date: string;
  locationId?: string | null;
}): Promise<BusinessHoliday | null> {
  const rows = await db
    .select()
    .from(businessHolidays)
    .where(
      and(
        eq(businessHolidays.businessId, input.businessId),
        eq(businessHolidays.date, input.date),
        input.locationId
          ? or(
              eq(businessHolidays.locationId, input.locationId),
              isNull(businessHolidays.locationId),
            )
          : or(isNull(businessHolidays.locationId)),
      ),
    );

  if (input.locationId) {
    const branchHoliday = rows.find((row) => row.locationId === input.locationId);
    if (branchHoliday) return branchHoliday;
  }

  return rows.find((row) => !row.locationId) ?? null;
}

export function isBusinessHolidayClosed(holiday: BusinessHoliday | null): boolean {
  return Boolean(holiday?.isClosed);
}

export function filterSlotsByBusinessHoliday(
  slots: TimeSlot[],
  holiday: BusinessHoliday | null,
  timezone: string,
): TimeSlot[] {
  if (!holiday || holiday.isClosed) return [];
  if (!holiday.startTime || !holiday.endTime) return slots;

  const localDate = parseISO(holiday.date);
  const dayStart = startOfDay(localDate);
  const startParts = parseTime(holiday.startTime);
  const endParts = parseTime(holiday.endTime);
  const windowStart = fromZonedTime(
    setMinutes(setHours(dayStart, startParts.hours), startParts.minutes),
    timezone,
  );
  const windowEnd = fromZonedTime(
    setMinutes(setHours(dayStart, endParts.hours), endParts.minutes),
    timezone,
  );

  return slots.filter((slot) => slot.startUtc >= windowStart && slot.startUtc < windowEnd);
}
