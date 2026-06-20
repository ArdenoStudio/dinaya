import { describe, expect, it } from "vitest";
import { parseISO, setHours, setMinutes, startOfDay } from "date-fns";
import { fromZonedTime } from "date-fns-tz";
import {
  filterSlotsByBusinessHoliday,
  isBusinessHolidayClosed,
} from "@/lib/business-holidays";
import type { BusinessHoliday } from "@/db/schema";

const TZ = "Asia/Colombo";

function holiday(overrides: Partial<BusinessHoliday>): BusinessHoliday {
  return {
    id: "h1",
    businessId: "b1",
    locationId: null,
    date: "2026-06-16",
    label: "Holiday",
    isClosed: true,
    startTime: null,
    endTime: null,
    createdAt: new Date(),
    ...overrides,
  };
}

describe("business holidays", () => {
  it("treats closed holidays as unavailable", () => {
    expect(isBusinessHolidayClosed(holiday({ isClosed: true }))).toBe(true);
    expect(filterSlotsByBusinessHoliday(
      [{ startUtc: new Date(), startLocal: "09:00", endLocal: "09:30" }],
      holiday({ isClosed: true }),
      TZ,
    )).toEqual([]);
  });

  it("returns slots unchanged when there is no holiday", () => {
    const slots = [
      { startUtc: new Date(), startLocal: "09:00", endLocal: "09:30", label: "9:00 AM" },
    ];
    expect(filterSlotsByBusinessHoliday(slots, null, TZ)).toEqual(slots);
  });

  it("keeps slots inside partial holiday windows", () => {
    const localDate = parseISO("2026-06-16");
    const dayStart = startOfDay(localDate);
    const inside = fromZonedTime(setMinutes(setHours(dayStart, 10), 0), TZ);
    const outside = fromZonedTime(setMinutes(setHours(dayStart, 8), 0), TZ);

    const slots = [
      { startUtc: inside, startLocal: "10:00", endLocal: "10:30" },
      { startUtc: outside, startLocal: "08:00", endLocal: "08:30" },
    ];

    const filtered = filterSlotsByBusinessHoliday(
      slots,
      holiday({ isClosed: false, startTime: "09:00", endTime: "12:00" }),
      TZ,
    );

    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.startLocal).toBe("10:00");
  });
});
