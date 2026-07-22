import type { DashboardNavHighlight, DocsMockupTarget } from "@content/docs/types";

/** Percentage rects over live dashboard/booking screenshots (0–100). Measured from 2560×1600 captures. */
export type DocsHighlightRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  label?: string;
};

/**
 * Sidebar rows measured from dashboard-marketing.png (retina 2560×1600).
 * Item cadence is ~6% apart after section headers.
 */
export const DOCS_NAV_RECTS: Record<DashboardNavHighlight, DocsHighlightRect> = {
  Overview: { x: 0.9, y: 13.5, w: 15.2, h: 3.8, label: "Overview" },
  Calendar: { x: 0.9, y: 19.5, w: 15.2, h: 3.8, label: "Calendar" },
  Bookings: { x: 0.9, y: 25.0, w: 15.2, h: 3.8, label: "Bookings" },
  Clients: { x: 0.9, y: 31.0, w: 15.2, h: 3.8, label: "Clients" },
  Services: { x: 0.9, y: 41.0, w: 15.2, h: 3.8, label: "Services" },
  Staff: { x: 0.9, y: 47.0, w: 15.2, h: 3.8, label: "Staff" },
  Locations: { x: 0.9, y: 53.0, w: 15.2, h: 3.8, label: "Locations" },
  Availability: { x: 0.9, y: 59.0, w: 15.2, h: 3.8, label: "Availability" },
  Reviews: { x: 0.9, y: 69.0, w: 15.2, h: 3.8, label: "Reviews" },
  Payments: { x: 0.9, y: 74.5, w: 15.2, h: 3.8, label: "Payments" },
  Marketing: { x: 0.8, y: 80.5, w: 15.5, h: 5.0, label: "Marketing" },
  Deals: { x: 0.9, y: 87.5, w: 15.2, h: 3.8, label: "Deals" },
  Broadcasts: { x: 0.9, y: 93.5, w: 15.2, h: 3.8, label: "Broadcasts" },
  // Below the fold / adjacent settings rail — approximate
  "AI Hub": { x: 0.9, y: 70.0, w: 15.2, h: 3.8, label: "AI Hub" },
  Reports: { x: 0.9, y: 74.0, w: 15.2, h: 3.8, label: "Reports" },
  Integrations: { x: 0.9, y: 80.0, w: 15.2, h: 3.8, label: "Integrations" },
  Automations: { x: 0.9, y: 84.0, w: 15.2, h: 3.8, label: "Automations" },
  "Plan & billing": { x: 0.9, y: 88.0, w: 15.2, h: 3.8, label: "Plan & billing" },
  Settings: { x: 0.9, y: 92.0, w: 15.2, h: 3.8, label: "Settings" },
};

/** In-page controls — WhatsApp/QR measured from blue pixel clusters on marketing shot. */
export const DOCS_TARGET_RECTS: Partial<Record<DocsMockupTarget, DocsHighlightRect>> = {
  "onboarding-business-info": { x: 22, y: 28, w: 56, h: 10, label: "Business info" },
  "marketing-booking-link": { x: 19.5, y: 28.5, w: 55, h: 7, label: "Booking link" },
  "marketing-copy-link": { x: 72, y: 28.5, w: 10, h: 7, label: "Copy" },
  "marketing-whatsapp": { x: 23.9, y: 38.7, w: 11.0, h: 5.5, label: "WhatsApp" },
  "marketing-qr-code": { x: 44.0, y: 38.7, w: 7.0, h: 5.5, label: "QR PNG" },
  "marketing-directory": { x: 19.5, y: 62, w: 38, h: 22, label: "Directory" },
  "marketing-embed": { x: 19.5, y: 78, w: 58, h: 14, label: "Embed" },
  "availability-weekly-hours": { x: 20, y: 24, w: 58, h: 36, label: "Weekly hours" },
  "availability-blocked-dates": { x: 20, y: 64, w: 58, h: 22, label: "Blocked dates" },
  "services-add-service": { x: 85.5, y: 10.2, w: 11.5, h: 5.2, label: "Add service" },
  "services-row": { x: 20, y: 28, w: 72, h: 10, label: "Service" },
  "bookings-new-booking": { x: 85.5, y: 10.2, w: 11.5, h: 5.2, label: "New booking" },
  "bookings-row": { x: 20, y: 30, w: 72, h: 10, label: "Booking" },
  "bookings-reschedule": { x: 70, y: 42, w: 12, h: 5, label: "Reschedule" },
  "bookings-cancel": { x: 82, y: 42, w: 10, h: 5, label: "Cancel" },
  "bookings-refund": { x: 70, y: 48, w: 12, h: 5, label: "Refund" },
  "billing-upgrade": { x: 68, y: 36, w: 18, h: 7, label: "Upgrade" },
  "integrations-connect": { x: 72, y: 32, w: 14, h: 6, label: "Connect" },
  "deals-new-deal": { x: 85.5, y: 10.2, w: 11.5, h: 5.2, label: "New deal" },
  "deals-row": { x: 20, y: 30, w: 72, h: 10, label: "Deal" },
  "booking-service-card": { x: 8, y: 28, w: 84, h: 14, label: "Service" },
  "booking-time-slot": { x: 8, y: 48, w: 40, h: 8, label: "Time" },
  "booking-confirm-pay": { x: 8, y: 82, w: 84, h: 10, label: "Confirm & Pay" },
  "booking-stars": { x: 20, y: 40, w: 60, h: 10, label: "Rating" },
  "booking-reschedule": { x: 8, y: 70, w: 40, h: 8, label: "Reschedule" },
  "booking-cancel": { x: 52, y: 70, w: 40, h: 8, label: "Cancel" },
};

export function resolveHighlightRects(options: {
  highlightNav?: DashboardNavHighlight;
  highlightTarget?: DocsMockupTarget;
}): DocsHighlightRect[] {
  const rects: DocsHighlightRect[] = [];
  // Prefer the in-page control when both are set — nav + control double cutouts compete.
  if (options.highlightTarget) {
    const target = DOCS_TARGET_RECTS[options.highlightTarget];
    if (target) rects.push(target);
    return rects;
  }
  if (options.highlightNav) {
    const nav = DOCS_NAV_RECTS[options.highlightNav];
    if (nav) rects.push(nav);
  }
  return rects;
}
