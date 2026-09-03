import { describe, expect, it } from "vitest";
import {
  cappedEventHeightPx,
  eventHeightPx,
  layoutOverlaps,
  topPercent,
  topPx,
  CALENDAR_MIN_EVENT_HEIGHT,
} from "./calendar-layout";

// No trailing "Z" — topPercent/topPx read local wall-clock time via
// getHours()/getMinutes() (matching how the dashboard shows times in the
// viewer's own timezone), so tests construct local-time strings too, making
// them deterministic regardless of the machine running them.
const iso = (hourMin: string) => `2026-09-03T${hourMin}:00.000`;

function item(id: string, startsAt: string, endsAt: string) {
  return { id, startsAt, endsAt };
}

describe("topPercent / topPx", () => {
  it("places the start-of-day hour at 0", () => {
    expect(topPercent(iso("07:00"))).toBe(0);
    expect(topPx(iso("07:00"))).toBe(0);
  });

  it("scales linearly through the day", () => {
    // 14:00 is 7 hours into a 14-hour (7am-9pm) window => 50%
    expect(topPercent(iso("14:00"))).toBeCloseTo(50, 5);
  });

  it("never goes negative for times before the start hour", () => {
    expect(topPercent(iso("03:00"))).toBe(0);
  });
});

describe("eventHeightPx", () => {
  it("scales with duration", () => {
    // 2 hours at 56px/hour = 112px, well above the floor
    expect(eventHeightPx(iso("09:00"), iso("11:00"))).toBe(112);
  });

  it("floors very short bookings to CALENDAR_MIN_EVENT_HEIGHT", () => {
    expect(eventHeightPx(iso("09:00"), iso("09:15"))).toBe(CALENDAR_MIN_EVENT_HEIGHT);
  });
});

describe("layoutOverlaps", () => {
  it("gives every booking its own full column when nothing overlaps", () => {
    const items = [
      item("a", iso("09:00"), iso("09:30")),
      item("b", iso("10:00"), iso("10:30")),
      item("c", iso("11:00"), iso("11:30")),
    ];
    const laidOut = layoutOverlaps(items);
    for (const b of laidOut) {
      expect(b.col).toBe(0);
      expect(b.totalCols).toBe(1);
    }
  });

  it("back-to-back bookings (end === next start) do not count as overlapping", () => {
    const items = [item("a", iso("09:00"), iso("10:00")), item("b", iso("10:00"), iso("11:00"))];
    const laidOut = layoutOverlaps(items);
    expect(laidOut.find((b) => b.id === "a")!.totalCols).toBe(1);
    expect(laidOut.find((b) => b.id === "b")!.totalCols).toBe(1);
  });

  it("splits two genuinely overlapping bookings into two side-by-side columns", () => {
    const items = [item("a", iso("09:00"), iso("10:00")), item("b", iso("09:30"), iso("10:30"))];
    const laidOut = layoutOverlaps(items);
    const a = laidOut.find((b) => b.id === "a")!;
    const b = laidOut.find((b) => b.id === "b")!;
    expect(a.totalCols).toBe(2);
    expect(b.totalCols).toBe(2);
    expect(a.col).not.toBe(b.col);
  });

  it("reuses a freed-up column instead of always growing column count", () => {
    // a: 9-10, b: 9-10 (overlaps a, needs its own column), c: 10-11 (a's column is free again)
    const items = [
      item("a", iso("09:00"), iso("10:00")),
      item("b", iso("09:00"), iso("10:00")),
      item("c", iso("10:00"), iso("11:00")),
    ];
    const laidOut = layoutOverlaps(items);
    const a = laidOut.find((x) => x.id === "a")!;
    const c = laidOut.find((x) => x.id === "c")!;
    // c should be able to reuse column 0 (a's column), since a already ended by the time c starts
    expect(c.col).toBe(a.col);
  });

  it("handles a three-way overlap with three columns", () => {
    const items = [
      item("a", iso("09:00"), iso("10:00")),
      item("b", iso("09:15"), iso("10:15")),
      item("c", iso("09:30"), iso("10:30")),
    ];
    const laidOut = layoutOverlaps(items);
    const totalCols = new Set(laidOut.map((x) => x.totalCols));
    expect(totalCols).toEqual(new Set([3]));
    const cols = new Set(laidOut.map((x) => x.col));
    expect(cols).toEqual(new Set([0, 1, 2]));
  });

  it("treats disjoint clusters independently (columns don't leak across gaps in time)", () => {
    const items = [
      item("a", iso("09:00"), iso("09:30")),
      item("b", iso("09:00"), iso("09:30")), // overlaps a -> cluster 1, 2 columns
      item("c", iso("14:00"), iso("14:30")), // isolated -> its own cluster, 1 column
    ];
    const laidOut = layoutOverlaps(items);
    expect(laidOut.find((x) => x.id === "c")!.totalCols).toBe(1);
  });
});

describe("cappedEventHeightPx", () => {
  it("never lets a short booking's rendered box reach the next booking in the same column", () => {
    // Two 15-min bookings back-to-back — natural height floors both to
    // CALENDAR_MIN_EVENT_HEIGHT (44px), which is taller than their actual
    // 15-min (14px) slot. The first one's box must not bleed into the second.
    const items = [item("a", iso("09:00"), iso("09:15")), item("b", iso("09:15"), iso("09:30"))];
    const laidOut = layoutOverlaps(items);
    const a = laidOut.find((x) => x.id === "a")!;
    const b = laidOut.find((x) => x.id === "b")!;

    const aHeight = cappedEventHeightPx(laidOut, a);
    const aBottom = topPx(a.startsAt) + aHeight;
    const bTop = topPx(b.startsAt);

    expect(aBottom).toBeLessThanOrEqual(bTop);
  });

  it("leaves a visible gap (not just zero-overlap) between capped back-to-back bookings", () => {
    const items = [item("a", iso("09:00"), iso("09:15")), item("b", iso("09:15"), iso("09:30"))];
    const laidOut = layoutOverlaps(items);
    const a = laidOut.find((x) => x.id === "a")!;
    const b = laidOut.find((x) => x.id === "b")!;

    const aBottom = topPx(a.startsAt) + cappedEventHeightPx(laidOut, a);
    const bTop = topPx(b.startsAt);

    expect(bTop - aBottom).toBeGreaterThan(0);
  });

  it("does not cap a booking's height based on items in a different column", () => {
    // a and b overlap (separate columns); c starts right after a ends, in a's column.
    const items = [
      item("a", iso("09:00"), iso("09:30")),
      item("b", iso("09:00"), iso("10:30")), // long booking sharing a's cluster, own column
      item("c", iso("09:30"), iso("10:00")), // should reuse a's column, not be capped by b
    ];
    const laidOut = layoutOverlaps(items);
    const c = laidOut.find((x) => x.id === "c")!;
    // c's natural (uncapped) height for a 30-min booking is 28px (below the
    // 44px floor, so it floors to 44) — since nothing follows c in its
    // column, it should render at its full natural height, not clipped by b.
    expect(cappedEventHeightPx(laidOut, c)).toBe(eventHeightPx(c.startsAt, c.endsAt) - 3);
  });

  it("uses the full natural height when there's nothing after it in its column", () => {
    const items = [item("a", iso("09:00"), iso("11:00"))];
    const laidOut = layoutOverlaps(items);
    const a = laidOut[0]!;
    expect(cappedEventHeightPx(laidOut, a)).toBe(eventHeightPx(a.startsAt, a.endsAt) - 3);
  });
});
