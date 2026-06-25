import { describe, expect, it } from "vitest";
import { bookingPanelMotion, bookingTransition } from "@/lib/booking/booking-motion";

describe("booking-motion", () => {
  it("disables motion when reduced motion is preferred", () => {
    expect(bookingTransition(true)).toEqual({ duration: 0 });
    expect(bookingPanelMotion(true, true)).toEqual({});
  });

  it("enables panel fade when motion is allowed", () => {
    const motion = bookingPanelMotion(false, true);
    expect(motion).toHaveProperty("variants");
    expect(motion).toHaveProperty("initial", "hidden");
    expect(motion).toHaveProperty("animate", "visible");
  });
});
