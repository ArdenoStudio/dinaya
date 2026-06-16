import { describe, expect, it } from "vitest";
import { addDays, format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { getAvailableSlots, isStaffClosedOnDate } from "./availability";

const TZ = "Asia/Colombo";

/** A Colombo-local "YYYY-MM-DD" string N days from now, for window tests that
 *  are relative to the real clock. */
function colomboDateInDays(days: number): string {
  return format(toZonedTime(addDays(new Date(), days), TZ), "yyyy-MM-dd");
}

/** Open 09:00–17:00 on every weekday, so a date on any future weekday has slots. */
const everyWeekday = Array.from({ length: 7 }, (_, dayOfWeek) => ({
  id: String(dayOfWeek),
  staffId: "s1",
  dayOfWeek,
  startTime: "09:00",
  endTime: "17:00",
}));

describe("getAvailableSlots", () => {
  it("returns slots within recurring availability", () => {
    const date = "2026-06-02"; // Tuesday
    const slots = getAvailableSlots({
      date,
      durationMinutes: 30,
      staffAvailability: [
        { id: "1", staffId: "s1", dayOfWeek: 2, startTime: "09:00", endTime: "10:00" },
      ],
      overrides: [],
      existingBookings: [],
    });

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0]?.startLocal).toBe("09:00");
  });

  it("returns no slots when the day is fully blocked", () => {
    const slots = getAvailableSlots({
      date: "2026-06-02",
      durationMinutes: 30,
      staffAvailability: [
        { id: "1", staffId: "s1", dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
      ],
      overrides: [
        {
          id: "o1",
          staffId: "s1",
          date: "2026-06-02",
          isBlocked: true,
          startTime: null,
          endTime: null,
          reason: null,
        },
      ],
      existingBookings: [],
    });

    expect(slots).toEqual([]);
  });

  it("excludes slots that overlap existing bookings", () => {
    const date = "2026-06-02";
    const slots = getAvailableSlots({
      date,
      durationMinutes: 30,
      staffAvailability: [
        { id: "1", staffId: "s1", dayOfWeek: 2, startTime: "09:00", endTime: "10:00" },
      ],
      overrides: [],
      existingBookings: [
        {
          startsAt: new Date("2026-06-02T03:30:00.000Z"),
          endsAt: new Date("2026-06-02T04:00:00.000Z"),
          status: "confirmed",
        },
      ],
    });

    expect(slots.some((slot) => slot.startLocal === "09:00")).toBe(false);
  });

  it("hides slots beyond the maximum advance window", () => {
    const slots = getAvailableSlots({
      date: colomboDateInDays(40),
      durationMinutes: 30,
      maximumAdvanceDays: 30,
      staffAvailability: everyWeekday,
      overrides: [],
      existingBookings: [],
    });

    expect(slots).toEqual([]);
  });

  it("keeps slots within the maximum advance window", () => {
    const slots = getAvailableSlots({
      date: colomboDateInDays(2),
      durationMinutes: 30,
      maximumAdvanceDays: 30,
      staffAvailability: everyWeekday,
      overrides: [],
      existingBookings: [],
    });

    expect(slots.length).toBeGreaterThan(0);
  });
});

describe("isStaffClosedOnDate", () => {
  it("returns true when the day is fully blocked", () => {
    expect(
      isStaffClosedOnDate({
        date: "2026-06-02",
        staffAvailability: [
          { id: "1", staffId: "s1", dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
        ],
        overrides: [
          {
            id: "o1",
            staffId: "s1",
            date: "2026-06-02",
            isBlocked: true,
            startTime: null,
            endTime: null,
            reason: null,
          },
        ],
      }),
    ).toBe(true);
  });

  it("returns true when there is no recurring availability", () => {
    expect(
      isStaffClosedOnDate({
        date: "2026-06-02",
        staffAvailability: [],
        overrides: [],
      }),
    ).toBe(true);
  });

  it("returns false when staff has recurring hours", () => {
    expect(
      isStaffClosedOnDate({
        date: "2026-06-02",
        staffAvailability: [
          { id: "1", staffId: "s1", dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
        ],
        overrides: [],
      }),
    ).toBe(false);
  });
});
