import { describe, expect, it } from "vitest";
import { isResolvableBookingImageUrl, resolveHeroImageUrl } from "@/lib/booking/hero-image";

describe("hero-image", () => {
  it("rejects demo placeholder paths", () => {
    expect(isResolvableBookingImageUrl("/demo/wax-in-the-city-banner.webp")).toBe(false);
    expect(isResolvableBookingImageUrl("https://cdn.example.com/banner.webp")).toBe(true);
  });

  it("picks the first usable gallery image", () => {
    expect(
      resolveHeroImageUrl(["/demo/missing.webp", "https://cdn.example.com/real.jpg"]),
    ).toBe("https://cdn.example.com/real.jpg");
  });

  it("returns null when gallery is hidden or empty", () => {
    expect(resolveHeroImageUrl(["/demo/x.webp"], { hideGallery: true })).toBeNull();
    expect(resolveHeroImageUrl([])).toBeNull();
  });
});
