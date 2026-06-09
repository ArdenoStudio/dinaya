import type { DocsGuide, GuideStep } from "@content/docs/types";

/** All mockup IDs used across documentation guides. */
export const DOCS_PREVIEW_MOCKUP_IDS = [
  "dashboard-overview",
  "dashboard-onboarding",
  "dashboard-bookings",
  "dashboard-services",
  "dashboard-staff",
  "dashboard-locations",
  "dashboard-availability",
  "dashboard-calendar",
  "dashboard-clients",
  "dashboard-reviews",
  "dashboard-payments",
  "dashboard-marketing",
  "dashboard-settings",
  "dashboard-integrations",
  "dashboard-payhere",
  "dashboard-billing",
  "dashboard-reports",
  "dashboard-ai",
  "dashboard-automations",
  "booking-service",
  "booking-time",
  "booking-confirm",
  "booking-manage",
  "booking-review",
] as const;

export type DocsPreviewMockupId = (typeof DOCS_PREVIEW_MOCKUP_IDS)[number];

/** Maps mockup IDs to captured screenshot paths in public/docs/screenshots/. */
export const DOCS_SCREENSHOT_MANIFEST: Record<string, string> = Object.fromEntries(
  DOCS_PREVIEW_MOCKUP_IDS.map((id) => [id, `/docs/screenshots/${id}.png`]),
);

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
