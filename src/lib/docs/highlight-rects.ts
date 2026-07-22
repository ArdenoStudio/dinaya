import type { DashboardNavHighlight, DocsMockupTarget } from "@content/docs/types";

/** Percentage rects over live dashboard/booking screenshots (0–100). Soft masks, not pixel-perfect. */
export type DocsHighlightRect = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Optional label shown near the cutout */
  label?: string;
};

/** Sidebar item positions on 1280×800 dashboard captures (left rail ~16% wide). */
export const DOCS_NAV_RECTS: Record<DashboardNavHighlight, DocsHighlightRect> = {
  Overview: { x: 1.4, y: 14.2, w: 13.8, h: 3.6, label: "Overview" },
  Calendar: { x: 1.4, y: 17.8, w: 13.8, h: 3.6, label: "Calendar" },
  Bookings: { x: 1.4, y: 21.4, w: 13.8, h: 3.6, label: "Bookings" },
  Clients: { x: 1.4, y: 25.0, w: 13.8, h: 3.6, label: "Clients" },
  Services: { x: 1.4, y: 31.6, w: 13.8, h: 3.6, label: "Services" },
  Staff: { x: 1.4, y: 35.2, w: 13.8, h: 3.6, label: "Staff" },
  Locations: { x: 1.4, y: 38.8, w: 13.8, h: 3.6, label: "Locations" },
  Availability: { x: 1.4, y: 42.4, w: 13.8, h: 3.6, label: "Availability" },
  Reviews: { x: 1.4, y: 49.0, w: 13.8, h: 3.6, label: "Reviews" },
  Payments: { x: 1.4, y: 52.6, w: 13.8, h: 3.6, label: "Payments" },
  Marketing: { x: 1.2, y: 55.5, w: 14.2, h: 4.2, label: "Marketing" },
  Deals: { x: 1.4, y: 59.8, w: 13.8, h: 3.6, label: "Deals" },
  Broadcasts: { x: 1.4, y: 63.4, w: 13.8, h: 3.6, label: "Broadcasts" },
  "AI Hub": { x: 1.4, y: 70.0, w: 13.8, h: 3.6, label: "AI Hub" },
  Reports: { x: 1.4, y: 73.6, w: 13.8, h: 3.6, label: "Reports" },
  Integrations: { x: 1.4, y: 80.2, w: 13.8, h: 3.6, label: "Integrations" },
  Automations: { x: 1.4, y: 83.8, w: 13.8, h: 3.6, label: "Automations" },
  "Plan & billing": { x: 1.4, y: 87.4, w: 13.8, h: 3.6, label: "Plan & billing" },
  Settings: { x: 1.4, y: 91.0, w: 13.8, h: 3.6, label: "Settings" },
};

/** In-page control targets on live screenshots. */
export const DOCS_TARGET_RECTS: Partial<Record<DocsMockupTarget, DocsHighlightRect>> = {
  "onboarding-business-info": { x: 22, y: 28, w: 56, h: 10, label: "Business info" },
  "marketing-booking-link": { x: 20, y: 28, w: 52, h: 7, label: "Booking link" },
  "marketing-copy-link": { x: 72, y: 28, w: 10, h: 7, label: "Copy" },
  "marketing-whatsapp": { x: 19.5, y: 40.5, w: 13.5, h: 5.2, label: "WhatsApp" },
  "marketing-qr-code": { x: 34, y: 40.5, w: 10, h: 5.2, label: "QR" },
  "marketing-directory": { x: 20, y: 68, w: 36, h: 18, label: "Directory" },
  "marketing-embed": { x: 20, y: 86, w: 58, h: 10, label: "Embed" },
  "availability-weekly-hours": { x: 20, y: 24, w: 58, h: 36, label: "Weekly hours" },
  "availability-blocked-dates": { x: 20, y: 64, w: 58, h: 22, label: "Blocked dates" },
  "services-add-service": { x: 78, y: 12, w: 14, h: 5, label: "Add service" },
  "services-row": { x: 20, y: 28, w: 72, h: 10, label: "Service" },
  "bookings-new-booking": { x: 78, y: 12, w: 14, h: 5, label: "New booking" },
  "bookings-row": { x: 20, y: 30, w: 72, h: 10, label: "Booking" },
  "bookings-reschedule": { x: 70, y: 42, w: 12, h: 5, label: "Reschedule" },
  "bookings-cancel": { x: 82, y: 42, w: 10, h: 5, label: "Cancel" },
  "bookings-refund": { x: 70, y: 48, w: 12, h: 5, label: "Refund" },
  "billing-upgrade": { x: 68, y: 36, w: 18, h: 7, label: "Upgrade" },
  "integrations-connect": { x: 72, y: 32, w: 14, h: 6, label: "Connect" },
  "deals-new-deal": { x: 78, y: 12, w: 14, h: 5, label: "New deal" },
  "deals-row": { x: 20, y: 30, w: 72, h: 10, label: "Deal" },
  // Booking phone screenshots — full-bleed device content
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
  if (options.highlightNav) {
    const nav = DOCS_NAV_RECTS[options.highlightNav];
    if (nav) rects.push(nav);
  }
  if (options.highlightTarget) {
    const target = DOCS_TARGET_RECTS[options.highlightTarget];
    if (target) rects.push(target);
  }
  return rects;
}
