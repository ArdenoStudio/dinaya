import { describe, expect, it } from "vitest";
import { canModifyClientBooking } from "./booking-reschedule";

describe("canModifyClientBooking", () => {
  it("blocks changes inside minimum notice window", () => {
    const startsAt = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const result = canModifyClientBooking({
      startsAt,
      status: "confirmed",
      minimumNoticeHours: 4,
      action: "reschedule",
    });

    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("4 hours");
  });

  it("allows changes when notice window is satisfied", () => {
    const startsAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    const result = canModifyClientBooking({
      startsAt,
      status: "confirmed",
      minimumNoticeHours: 4,
      action: "cancel",
    });

    expect(result.allowed).toBe(true);
  });
});
