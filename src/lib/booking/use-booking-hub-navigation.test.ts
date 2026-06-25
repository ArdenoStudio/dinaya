import { describe, expect, it } from "vitest";
import { buildServiceBookingPath } from "@/lib/booking-url";

describe("booking hub navigation paths", () => {
  it("builds service paths for pushState", () => {
    expect(buildServiceBookingPath("wax-in-the-city", "brazilian-wax")).toBe(
      "/book/wax-in-the-city/brazilian-wax",
    );
  });
});
