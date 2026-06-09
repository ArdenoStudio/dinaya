import { describe, expect, it } from "vitest";
import type { DocsGuide } from "@content/docs/types";
import { getGuidePreviewMockupId, getScreenshotForMockup } from "./visuals";

describe("docs visuals", () => {
  it("maps dashboard mockups to screenshot paths", () => {
    expect(getScreenshotForMockup("dashboard-bookings")).toBe(
      "/docs/screenshots/dashboard-bookings.png",
    );
    expect(getScreenshotForMockup("booking-service")).toBe(
      "/docs/screenshots/booking-service.png",
    );
  });

  it("prefers explicit thumbnail mockup id", () => {
    const guide = {
      slug: "test",
      title: "Test",
      description: "Test",
      category: "getting-started",
      estimatedMinutes: 1,
      thumbnailMockupId: "dashboard-marketing",
      steps: [{ title: "Step", body: "Body", visual: { type: "mockup", mockupId: "dashboard-overview" } }],
    } satisfies DocsGuide;

    expect(getGuidePreviewMockupId(guide)).toBe("dashboard-marketing");
  });

  it("falls back to first step mockup", () => {
    const guide = {
      slug: "test",
      title: "Test",
      description: "Test",
      category: "getting-started",
      estimatedMinutes: 1,
      steps: [{ title: "Step", body: "Body", visual: { type: "mockup", mockupId: "dashboard-services" } }],
    } satisfies DocsGuide;

    expect(getGuidePreviewMockupId(guide)).toBe("dashboard-services");
  });
});
