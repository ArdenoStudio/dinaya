import { describe, expect, it } from "vitest";
import { normalizeAccentColor, buildBookingThemeStyle } from "@/lib/booking-theme";
import { slugifyServiceName } from "@/lib/service-slug";

describe("booking-theme", () => {
  it("normalizes valid hex colors", () => {
    expect(normalizeAccentColor("#AbCdEf")).toBe("#abcdef");
  });

  it("falls back for invalid colors", () => {
    expect(normalizeAccentColor("red")).toBe("#2563eb");
    expect(normalizeAccentColor(null)).toBe("#2563eb");
  });

  it("builds CSS variables", () => {
    const style = buildBookingThemeStyle("#ff0000");
    expect(style["--booking-accent"]).toBe("#ff0000");
  });
});

describe("service-slug", () => {
  it("slugifies service names", () => {
    expect(slugifyServiceName("Hair Cut & Style")).toBe("hair-cut-style");
    expect(slugifyServiceName("  Bridal  Makeup!!! ")).toBe("bridal-makeup");
  });
});
