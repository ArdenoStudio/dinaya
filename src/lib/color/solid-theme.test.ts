import { describe, expect, it } from "vitest";
import { applySolidBookingTheme, isSolidBookingTheme } from "@/lib/color/solid-theme";

describe("solid-theme", () => {
  it("detects solid accent backgrounds", () => {
    expect(isSolidBookingTheme("accent", "accent")).toBe(true);
    expect(isSolidBookingTheme("white", "white")).toBe(false);
    expect(isSolidBookingTheme("accent", "white")).toBe(false);
  });

  it("maps the solid switch to accent or white surfaces", () => {
    expect(applySolidBookingTheme(true)).toEqual({
      bookingPageBackground: "accent",
      bookingPanelBackground: "accent",
    });
    expect(applySolidBookingTheme(false)).toEqual({
      bookingPageBackground: "white",
      bookingPanelBackground: "white",
    });
  });
});
