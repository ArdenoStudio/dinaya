import type { DocsGuide, GuideStep } from "@content/docs/types";

/** Maps dashboard mockup IDs to captured screenshot paths (when available). */
export const DOCS_SCREENSHOT_MANIFEST: Record<string, string> = {
  "dashboard-overview": "/docs/screenshots/dashboard-overview.png",
  "dashboard-bookings": "/docs/screenshots/dashboard-bookings.png",
  "dashboard-services": "/docs/screenshots/dashboard-services.png",
  "dashboard-staff": "/docs/screenshots/dashboard-staff.png",
  "dashboard-locations": "/docs/screenshots/dashboard-locations.png",
  "dashboard-availability": "/docs/screenshots/dashboard-availability.png",
  "dashboard-calendar": "/docs/screenshots/dashboard-calendar.png",
  "dashboard-clients": "/docs/screenshots/dashboard-clients.png",
  "dashboard-reviews": "/docs/screenshots/dashboard-reviews.png",
  "dashboard-payments": "/docs/screenshots/dashboard-payments.png",
  "dashboard-marketing": "/docs/screenshots/dashboard-marketing.png",
  "dashboard-settings": "/docs/screenshots/dashboard-settings.png",
  "dashboard-integrations": "/docs/screenshots/dashboard-integrations.png",
  "dashboard-payhere": "/docs/screenshots/dashboard-settings.png",
};

export function getScreenshotForMockup(mockupId: string): string | undefined {
  return DOCS_SCREENSHOT_MANIFEST[mockupId];
}

export function getGuidePreviewMockupId(guide: DocsGuide): string | undefined {
  if (guide.thumbnailMockupId) return guide.thumbnailMockupId;
  return getStepPreviewMockupId(guide.steps[0]);
}

export function getStepPreviewMockupId(step: GuideStep | undefined): string | undefined {
  if (!step?.visual) return undefined;
  if (step.visual.type === "mockup") return step.visual.mockupId;
  if (step.visual.type === "screenshot") return step.visual.src;
  return undefined;
}

export function prefersScreenshotVisual(mockupId: string): boolean {
  return Boolean(getScreenshotForMockup(mockupId));
}
