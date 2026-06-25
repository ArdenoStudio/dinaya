import { describe, expect, it } from "vitest";
import { bookingLogoHasIntrinsicPadding } from "./logo-avatar";

describe("bookingLogoHasIntrinsicPadding", () => {
  it("detects svg logos with baked-in canvas padding", () => {
    expect(bookingLogoHasIntrinsicPadding("/dinaya-logo.svg")).toBe(true);
    expect(bookingLogoHasIntrinsicPadding("https://cdn.example.com/logo.svg?v=1")).toBe(true);
  });

  it("treats raster logos as unpadded", () => {
    expect(bookingLogoHasIntrinsicPadding("https://cdn.example.com/logo.png")).toBe(false);
  });
});
