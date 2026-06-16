import { db } from "@/db";
import { availability, availabilityOverrides, bookings, staff } from "@/db/schema";
import { and, count, eq, gte, lt } from "drizzle-orm";
import { endOfDay, parseISO, startOfDay } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import { getAvailableSlots, isStaffClosedOnDate } from "@/lib/availability";
import {
  filterSlotsByBusinessHoliday,
  getBusinessHolidayForDate,
  isBusinessHolidayClosed,
} from "@/lib/business-holidays";
import { getActiveReservationsForStaff } from "@/lib/slot-reservations";

export type SlotWithStaff = {
  startUtc: Date;
  endUtc: Date;
  startLocal: string;
  label: string;
  staffId: string;
};

export async function getMergedSlotsForStaff({
  staffIds,
  businessId,
  serviceId,
  date,
  durationMinutes,
  beforeBuffer,
  afterBuffer,
  minimumNoticeHours,
  maximumAdvanceDays,
  dailyCapacity,
  timezone,
  locationId,
  sessionToken,
}: {
  staffIds: string[];
  businessId: string;
  serviceId: string;
  date: string;
  durationMinutes: number;
  beforeBuffer: number;
  afterBuffer: number;
  minimumNoticeHours: number;
  maximumAdvanceDays: number;
  dailyCapacity: number | null;
  timezone: string;
  locationId?: string | null;
  sessionToken?: string;
}): Promise<{ slots: SlotWithStaff[]; closed: boolean; capacityReached: boolean }> {
  if (staffIds.length === 0) {
    return { slots: [], closed: true, capacityReached: false };
  }

  const holiday = await getBusinessHolidayForDate({ businessId, date, locationId });
  if (isBusinessHolidayClosed(holiday)) {
    return { slots: [], closed: true, capacityReached: false };
  }

  const localDate = parseISO(date);
  const dayStartUtc = fromZonedTime(startOfDay(localDate), timezone);
  const dayEndUtc = fromZonedTime(endOfDay(localDate), timezone);

  const merged = new Map<string, SlotWithStaff>();

  for (const staffId of staffIds) {
    if (dailyCapacity != null) {
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

      if (capacityRow && Number(capacityRow.value) >= dailyCapacity) {
        continue;
      }
    }

    const [staffMember, staffAvailability, overrides, existingBookings, reservations] =
      await Promise.all([
        db
          .select({ isActive: staff.isActive })
          .from(staff)
          .where(eq(staff.id, staffId))
          .limit(1)
          .then(([row]) => row),
        db.select().from(availability).where(eq(availability.staffId, staffId)),
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
        getActiveReservationsForStaff(staffId, dayStartUtc, dayEndUtc, sessionToken),
      ]);

    if (!staffMember?.isActive) continue;
    if (isStaffClosedOnDate({ date, staffAvailability, overrides })) continue;

    const blockedReservations = reservations.map((r) => ({
      startsAt: r.startsAt,
      endsAt: r.endsAt,
      status: "confirmed" as const,
    }));

    let slots = getAvailableSlots({
      date,
      durationMinutes,
      beforeBuffer,
      afterBuffer,
      minimumNoticeHours,
      maximumAdvanceDays,
      staffAvailability,
      overrides,
      existingBookings: [...existingBookings, ...blockedReservations],
      timezone,
    });

    slots = filterSlotsByBusinessHoliday(slots, holiday, timezone);

    for (const slot of slots) {
      const key = slot.startUtc.toISOString();
      if (!merged.has(key)) {
        merged.set(key, { ...slot, staffId });
      }
    }
  }

  const slots = Array.from(merged.values()).sort(
    (a, b) => a.startUtc.getTime() - b.startUtc.getTime(),
  );

  return {
    slots,
    closed: false,
    capacityReached: slots.length === 0 && staffIds.length > 0,
  };
}
