import type { DashboardNavHighlight, DocsMockupTarget } from "@content/docs/types";

/**
 * Percentage cutouts for `DocsScreenshotHighlight` over live PNGs in `public/docs/screenshots/`.
 * Coordinates are 0–100 relative to the image (origin top-left).
 *
 * Prefer `DOCS_SHOT_ACTIVE_NAV[shotId]` (measured active sidebar pill on that PNG).
 * `DOCS_NAV_RECTS` is the label fallback when the shot id is unknown or mismatched.
 */

export type DocsHighlightRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
};

/** Active sidebar pill measured per dashboard capture (`dashboard-*.png`). */
export const DOCS_SHOT_ACTIVE_NAV: Record<string, DocsHighlightRect> = {
  "dashboard-ai": { x: 0.28, y: 46.9, w: 18.75, h: 6.2 },
  "dashboard-automations": { x: 0.28, y: 51.65, w: 18.75, h: 6.2 },
  "dashboard-availability": { x: 0.28, y: 57.78, w: 18.75, h: 6.2 },
  "dashboard-billing": { x: 0.28, y: 46.9, w: 18.75, h: 6.2 },
  "dashboard-bookings": { x: 0.28, y: 23.65, w: 18.75, h: 6.2 },
  "dashboard-calendar": { x: 0.28, y: 17.65, w: 18.75, h: 6.2 },
  "dashboard-clients": { x: 0.28, y: 29.65, w: 18.75, h: 6.2 },
  "dashboard-deals": { x: 0.28, y: 85.78, w: 18.75, h: 6.2 },
  "dashboard-integrations": { x: 0.28, y: 46.9, w: 18.75, h: 6.2 },
  "dashboard-locations": { x: 0.28, y: 51.78, w: 18.75, h: 6.2 },
  "dashboard-marketing": { x: 0.28, y: 79.78, w: 18.75, h: 6.2 },
  "dashboard-onboarding": { x: 0.28, y: 11.65, w: 18.75, h: 6.2 },
  "dashboard-overview": { x: 0.28, y: 11.65, w: 18.75, h: 6.2 },
  "dashboard-payhere": { x: 0.28, y: 46.9, w: 18.75, h: 6.2 },
  "dashboard-payments": { x: 0.28, y: 73.78, w: 18.75, h: 6.2 },
  "dashboard-reports": { x: 0.28, y: 46.9, w: 18.75, h: 6.2 },
  "dashboard-reviews": { x: 0.28, y: 67.78, w: 18.75, h: 6.2 },
  "dashboard-services": { x: 0.28, y: 39.78, w: 18.75, h: 6.2 },
  "dashboard-settings": { x: 0.28, y: 46.9, w: 18.75, h: 6.2 },
  "dashboard-staff": { x: 0.28, y: 45.78, w: 18.75, h: 6.2 },
};

/** Which nav label is active on each dashboard shot. */
export const DOCS_SHOT_NAV_LABEL: Record<string, DashboardNavHighlight> = {
  "dashboard-ai": "AI Hub",
  "dashboard-automations": "Automations",
  "dashboard-availability": "Availability",
  "dashboard-billing": "Plan & billing",
  "dashboard-bookings": "Bookings",
  "dashboard-calendar": "Calendar",
  "dashboard-clients": "Clients",
  "dashboard-deals": "Deals",
  "dashboard-integrations": "Integrations",
  "dashboard-locations": "Locations",
  "dashboard-marketing": "Marketing",
  "dashboard-onboarding": "Overview",
  "dashboard-overview": "Overview",
  "dashboard-payhere": "Settings",
  "dashboard-payments": "Payments",
  "dashboard-reports": "Reports",
  "dashboard-reviews": "Reviews",
  "dashboard-services": "Services",
  "dashboard-settings": "Settings",
  "dashboard-staff": "Staff",
};

/** Label geometry fallback (same measurements as the matching shot when available). */
export const DOCS_NAV_RECTS: Record<DashboardNavHighlight, DocsHighlightRect> = {
  "Overview": { x: 0.28, y: 11.65, w: 18.75, h: 6.2, label: "Overview" },
  "Calendar": { x: 0.28, y: 17.65, w: 18.75, h: 6.2, label: "Calendar" },
  "Bookings": { x: 0.28, y: 23.65, w: 18.75, h: 6.2, label: "Bookings" },
  "Clients": { x: 0.28, y: 29.65, w: 18.75, h: 6.2, label: "Clients" },
  "Services": { x: 0.28, y: 39.78, w: 18.75, h: 6.2, label: "Services" },
  "Staff": { x: 0.28, y: 45.78, w: 18.75, h: 6.2, label: "Staff" },
  "Locations": { x: 0.28, y: 51.78, w: 18.75, h: 6.2, label: "Locations" },
  "Availability": { x: 0.28, y: 57.78, w: 18.75, h: 6.2, label: "Availability" },
  "Reviews": { x: 0.28, y: 67.78, w: 18.75, h: 6.2, label: "Reviews" },
  "Payments": { x: 0.28, y: 73.78, w: 18.75, h: 6.2, label: "Payments" },
  "Marketing": { x: 0.28, y: 79.78, w: 18.75, h: 6.2, label: "Marketing" },
  "Deals": { x: 0.28, y: 85.78, w: 18.75, h: 6.2, label: "Deals" },
  "AI Hub": { x: 0.28, y: 46.9, w: 18.75, h: 6.2, label: "AI Hub" },
  "Reports": { x: 0.28, y: 46.9, w: 18.75, h: 6.2, label: "Reports" },
  "Integrations": { x: 0.28, y: 46.9, w: 18.75, h: 6.2, label: "Integrations" },
  "Automations": { x: 0.28, y: 51.65, w: 18.75, h: 6.2, label: "Automations" },
  "Plan & billing": { x: 0.28, y: 46.9, w: 18.75, h: 6.2, label: "Plan & billing" },
  "Settings": { x: 0.28, y: 46.9, w: 18.75, h: 6.2, label: "Settings" },
  "Broadcasts": { x: 0.28, y: 91.78, w: 18.75, h: 6.2, label: "Broadcasts" },
};

/** Interactive / CTA cutouts keyed by `DocsMockupTarget`. */
export const DOCS_TARGET_RECTS: Partial<Record<DocsMockupTarget, DocsHighlightRect>> = {
  "availability-blocked-dates": { x: 20, y: 64, w: 58, h: 22, label: "Blocked dates" },
  "availability-weekly-hours": { x: 20, y: 22, w: 58, h: 40, label: "Weekly hours" },
  "billing-upgrade": { x: 23.41, y: 50.75, w: 18.5, h: 6.25, label: "Upgrade" },
  "booking-cancel": { x: 52, y: 16, w: 40, h: 6, label: "Cancel" },
  "booking-confirm-pay": { x: 7.5, y: 68.5, w: 85, h: 6.5, label: "Confirm & Pay" },
  "booking-reschedule": { x: 8, y: 16, w: 40, h: 6, label: "Reschedule" },
  "booking-service-card": { x: 4, y: 54, w: 92, h: 14, label: "Service" },
  "booking-stars": { x: 8, y: 16, w: 50, h: 7, label: "Rating" },
  // First morning slot in the Available-times sheet (top-left of the grid).
  "booking-time-slot": { x: 6, y: 24, w: 42, h: 6.5, label: "Time" },
  "bookings-cancel": { x: 82, y: 42, w: 10, h: 5, label: "Cancel" },
  "bookings-new-booking": { x: 79.68, y: 9.85, w: 9.86, h: 6.05, label: "New booking" },
  "bookings-refund": { x: 70, y: 48, w: 12, h: 5, label: "Refund" },
  "bookings-reschedule": { x: 70, y: 42, w: 12, h: 5, label: "Reschedule" },
  "bookings-row": { x: 20, y: 30, w: 72, h: 10, label: "Booking" },
  "deals-new-deal": { x: 87.96, y: 9.85, w: 9.55, h: 6.05, label: "New deal" },
  "deals-row": { x: 20, y: 30, w: 72, h: 10, label: "Deal" },
  "integrations-connect": { x: 80.75, y: 44.88, w: 6.08, h: 5.75, label: "Connect" },
  "marketing-booking-link": { x: 19.5, y: 28.5, w: 55, h: 7, label: "Booking link" },
  "marketing-copy-link": { x: 72, y: 28.5, w: 10, h: 7, label: "Copy" },
  "marketing-directory": { x: 19.5, y: 62, w: 38, h: 22, label: "Directory" },
  "marketing-embed": { x: 19.5, y: 78, w: 58, h: 14, label: "Embed" },
  "marketing-qr-code": { x: 44, y: 38.7, w: 7, h: 5.5, label: "QR PNG" },
  "marketing-whatsapp": { x: 23.41, y: 38.38, w: 11.86, h: 6.25, label: "WhatsApp" },
  "onboarding-business-info": { x: 22, y: 30, w: 56, h: 12, label: "Business info" },
  "services-add-service": { x: 86.55, y: 9.85, w: 10.96, h: 6.05, label: "Add service" },
  "services-row": { x: 20, y: 28, w: 72, h: 10, label: "Service" },
};

export function shotIdFromSrc(src: string | undefined): string | undefined {
  if (!src) return undefined;
  const m = src.match(/\/([^/]+)\.png(?:\?|$)/);
  return m?.[1];
}

export function resolveHighlightRects(options: {
  highlightNav?: DashboardNavHighlight;
  highlightTarget?: DocsMockupTarget;
  /** Filename stem of the PNG, e.g. `dashboard-marketing`. */
  shotId?: string;
}): DocsHighlightRect[] {
  const rects: DocsHighlightRect[] = [];
  // Prefer the in-page control when both are set — nav + control double cutouts compete.
  if (options.highlightTarget) {
    const target = DOCS_TARGET_RECTS[options.highlightTarget];
    if (target) rects.push(target);
    return rects;
  }
  if (options.highlightNav) {
    const shotNav =
      options.shotId && DOCS_SHOT_NAV_LABEL[options.shotId] === options.highlightNav
        ? DOCS_SHOT_ACTIVE_NAV[options.shotId]
        : undefined;
    const nav = shotNav ?? DOCS_NAV_RECTS[options.highlightNav];
    if (nav) rects.push(nav);
  }
  return rects;
}
