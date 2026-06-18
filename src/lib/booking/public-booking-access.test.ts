import { describe, expect, it } from "vitest";
import {
  bookingBelongsToSlug,
  parseRequiredBusinessSlug,
} from "@/lib/booking/public-booking-access";

describe("public booking access", () => {
  it("requires a non-empty slug", () => {
    expect(parseRequiredBusinessSlug(null)).toBeNull();
    expect(parseRequiredBusinessSlug("")).toBeNull();
    expect(parseRequiredBusinessSlug("   ")).toBeNull();
    expect(parseRequiredBusinessSlug("ardeno-studio")).toBe("ardeno-studio");
  });

  it("matches business slug exactly", () => {
    expect(bookingBelongsToSlug("ardeno-studio", "ardeno-studio")).toBe(true);
    expect(bookingBelongsToSlug("ardeno-studio", "other")).toBe(false);
  });
});
