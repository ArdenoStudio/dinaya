import { describe, expect, it } from "vitest";
import { hasExactSlotDuration } from "@/lib/slot-reservation-validation";

describe("slot reservation interval validation", () => {
  it("rejects an interval spanning beyond the service duration", () => {
    expect(
      hasExactSlotDuration({
        startsAt: new Date("2026-06-20T03:30:00.000Z"),
        endsAt: new Date("2030-06-20T04:00:00.000Z"),
        durationMinutes: 30,
      }),
    ).toBe(false);
  });

  it("accepts the exact service duration", () => {
    expect(
      hasExactSlotDuration({
        startsAt: new Date("2026-06-20T03:30:00.000Z"),
        endsAt: new Date("2026-06-20T04:00:00.000Z"),
        durationMinutes: 30,
      }),
    ).toBe(true);
  });
});
