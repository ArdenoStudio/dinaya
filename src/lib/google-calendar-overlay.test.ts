import { describe, expect, it } from "vitest";
import {
  busyTimesForDate,
  countBusyDates,
  getCalendarDayBounds,
  getCalendarMonthBounds,
  slotConflictsWithBusyTime,
} from "@/lib/google-calendar-overlay";

describe("Google Calendar booking overlay", () => {
  it("builds local-day bounds in the business timezone", () => {
    expect(getCalendarDayBounds("2026-06-18", "Asia/Colombo")).toEqual({
      timeMin: "2026-06-17T18:30:00.000Z",
      timeMax: "2026-06-18T18:30:00.000Z",
    });
  });

  it("builds local-month bounds in the business timezone", () => {
    expect(getCalendarMonthBounds("2026-06", "Asia/Colombo")).toEqual({
      timeMin: "2026-05-31T18:30:00.000Z",
      timeMax: "2026-06-30T18:30:00.000Z",
    });
  });

  it("filters busy times to a selected local day", () => {
    const busy = [
      {
        start: "2026-06-17T18:30:00.000Z",
        end: "2026-06-18T06:30:00.000Z",
      },
      {
        start: "2026-06-18T18:30:00.000Z",
        end: "2026-06-19T06:30:00.000Z",
      },
    ];

    expect(busyTimesForDate("2026-06-18", busy, "Asia/Colombo")).toEqual([busy[0]]);
    expect(busyTimesForDate("2026-06-19", busy, "Asia/Colombo")).toEqual([busy[1]]);
  });

  it("counts busy periods per local day", () => {
    const busy = [
      {
        start: "2026-06-18T04:30:00.000Z",
        end: "2026-06-18T05:30:00.000Z",
      },
      {
        start: "2026-06-18T08:30:00.000Z",
        end: "2026-06-18T09:30:00.000Z",
      },
    ];

    expect(countBusyDates(busy, "Asia/Colombo")).toEqual({
      "2026-06-18": 2,
    });
  });

  it("detects overlapping slots but permits touching boundaries", () => {
    const busy = [
      {
        start: "2026-06-18T04:30:00.000Z",
        end: "2026-06-18T05:30:00.000Z",
      },
    ];

    expect(
      slotConflictsWithBusyTime(
        {
          startUtc: "2026-06-18T05:00:00.000Z",
          endUtc: "2026-06-18T06:00:00.000Z",
        },
        busy,
      ),
    ).toBe(true);
    expect(
      slotConflictsWithBusyTime(
        {
          startUtc: "2026-06-18T03:30:00.000Z",
          endUtc: "2026-06-18T04:30:00.000Z",
        },
        busy,
      ),
    ).toBe(false);
    expect(
      slotConflictsWithBusyTime(
        {
          startUtc: "2026-06-18T05:30:00.000Z",
          endUtc: "2026-06-18T06:30:00.000Z",
        },
        busy,
      ),
    ).toBe(false);
  });
});
