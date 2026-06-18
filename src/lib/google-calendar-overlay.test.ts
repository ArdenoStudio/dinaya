import { describe, expect, it } from "vitest";
import {
  getCalendarDayBounds,
  slotConflictsWithBusyTime,
} from "@/lib/google-calendar-overlay";

describe("Google Calendar booking overlay", () => {
  it("builds local-day bounds in the business timezone", () => {
    expect(getCalendarDayBounds("2026-06-18", "Asia/Colombo")).toEqual({
      timeMin: "2026-06-17T18:30:00.000Z",
      timeMax: "2026-06-18T18:30:00.000Z",
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
