import { describe, expect, it } from "vitest";
import { selectUpsellRecommendation } from "./upsell";

describe("AI upsell selection", () => {
  it("chooses the nearest higher-value service first", () => {
    const recommendation = selectUpsellRecommendation(
      { id: "basic", name: "Classic Cut", priceLkr: 2500, durationMinutes: 30 },
      [
        { id: "premium", name: "Premium Cut", priceLkr: 4500, durationMinutes: 50 },
        { id: "deluxe", name: "Deluxe Cut", priceLkr: 3500, durationMinutes: 45 },
      ],
    );

    expect(recommendation).toMatchObject({
      serviceId: "deluxe",
      name: "Deluxe Cut",
      reason: "A popular upgrade from Classic Cut.",
    });
  });

  it("falls back to the shortest add-on when no upgrade exists", () => {
    const recommendation = selectUpsellRecommendation(
      { id: "main", name: "Full Facial", priceLkr: 8000, durationMinutes: 60 },
      [
        { id: "massage", name: "Head Massage", priceLkr: 1800, durationMinutes: 15 },
        { id: "mask", name: "Glow Mask", priceLkr: 2200, durationMinutes: 10 },
      ],
    );

    expect(recommendation).toMatchObject({
      serviceId: "mask",
      name: "Glow Mask",
      reason: "Pairs well with Full Facial.",
    });
  });
});
