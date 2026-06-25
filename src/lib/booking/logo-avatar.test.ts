import { describe, expect, it } from "vitest";
import {
  bookingLogoHasIntrinsicPadding,
  bookingLogoHubImageScale,
  BOOKING_LOGO_HUB_RASTER_SCALE,
  BOOKING_LOGO_PADDED_SCALE,
} from "./logo-avatar";

describe("bookingLogoHasIntrinsicPadding", () => {
  it("detects svg logos with baked-in canvas padding", () => {
    expect(bookingLogoHasIntrinsicPadding("/dinaya-logo.svg")).toBe(true);
    expect(bookingLogoHasIntrinsicPadding("https://cdn.example.com/logo.svg?v=1")).toBe(true);
  });

  it("treats raster logos as unpadded", () => {
    expect(bookingLogoHasIntrinsicPadding("https://cdn.example.com/logo.png")).toBe(false);
  });
});

describe("bookingLogoHubImageScale", () => {
  it("uses a softer hub zoom for raster logos", () => {
    expect(bookingLogoHubImageScale("https://cdn.example.com/logo.svg")).toBe(
      BOOKING_LOGO_PADDED_SCALE,
    );
    expect(bookingLogoHubImageScale("https://cdn.example.com/logo.webp")).toBe(
      BOOKING_LOGO_HUB_RASTER_SCALE,
    );
  });
});
