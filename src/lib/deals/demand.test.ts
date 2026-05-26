import { describe, expect, it } from "vitest";
import { adjustDiscountForDemand, assessDemandForGap } from "./demand";

const timezone = "Asia/Colombo";

describe("deal demand assessment", () => {
  it("marks long low-utilization gaps as discountable", () => {
    const demand = assessDemandForGap({
      targetWindowStart: new Date("2026-05-27T04:30:00Z"),
      targetWindowEnd: new Date("2026-05-27T07:30:00Z"),
      gapMinutes: 180,
      availableSlotCount: 18,
      currentBookings: [],
      historicalBookings: [
        { startsAt: "2026-05-20T04:30:00Z", endsAt: "2026-05-20T05:30:00Z", status: "completed" },
        { startsAt: "2026-05-06T08:30:00Z", endsAt: "2026-05-06T09:30:00Z", status: "completed" },
        { startsAt: "2026-04-22T08:30:00Z", endsAt: "2026-04-22T09:30:00Z", status: "completed" },
        { startsAt: "2026-04-08T08:30:00Z", endsAt: "2026-04-08T09:30:00Z", status: "completed" },
      ],
      timezone,
    });

    expect(demand.shouldSuggest).toBe(true);
    expect(demand.demandLabel).toBe("quiet");
    expect(adjustDiscountForDemand(30, demand)).toBeGreaterThan(30);
  });

  it("suppresses suggestions when the same window is historically busy", () => {
    const historicalBookings = [7, 14, 21, 28, 35, 42, 49, 56].map((daysBack) => {
      const startsAt = new Date("2026-05-27T04:30:00Z");
      startsAt.setUTCDate(startsAt.getUTCDate() - daysBack);
      const endsAt = new Date(startsAt.getTime() + 60 * 60_000);
      return { startsAt, endsAt, status: "completed" };
    });

    const demand = assessDemandForGap({
      targetWindowStart: new Date("2026-05-27T04:30:00Z"),
      targetWindowEnd: new Date("2026-05-27T07:30:00Z"),
      gapMinutes: 180,
      availableSlotCount: 10,
      currentBookings: [],
      historicalBookings,
      timezone,
    });

    expect(demand.shouldSuggest).toBe(false);
    expect(demand.demandLabel).toBe("busy");
    expect(demand.historicalSameWindowFillRate).toBeGreaterThanOrEqual(0.6);
  });

  it("counts Google Calendar busy windows as current demand", () => {
    const demand = assessDemandForGap({
      targetWindowStart: new Date("2026-05-27T04:30:00Z"),
      targetWindowEnd: new Date("2026-05-27T05:30:00Z"),
      gapMinutes: 60,
      availableSlotCount: 1,
      currentBookings: [
        {
          startsAt: "2026-05-27T03:30:00Z",
          endsAt: "2026-05-27T06:30:00Z",
          status: "confirmed",
          source: "google_calendar",
        },
      ],
      historicalBookings: [],
      timezone,
    });

    expect(demand.shouldSuggest).toBe(false);
    expect(demand.sources.some((source) => source.source === "google_calendar")).toBe(true);
  });
});
