import type { DocsGuide } from "../types";

export const dashboardPaymentsGuide: DocsGuide = {
  slug: "dashboard-payments",
  title: "Payments & revenue",
  description: "Track what you have earned, pending, and refunded.",
  category: "growth",
  estimatedMinutes: 3,
  relatedGuides: ["connect-payhere", "manage-bookings"],
  faqIds: ["receipt"],
  steps: [
    {
      title: "Payments overview",
      body: "Dashboard → Payments shows revenue summaries, recent transactions, and settlement status.",
      visual: { type: "mockup", mockupId: "dashboard-payments" },
      highlightNav: "Payments",
    },
    {
      title: "Per-booking detail",
      body: "Open any booking to see deposit vs balance, PayHere reference, and refund history.",
      visual: { type: "mockup", mockupId: "dashboard-bookings" },
    },
    {
      title: "Reports",
      body: "Pro plans include Reports for deeper breakdowns by service, staff, and time period.",
      visual: { type: "mockup", mockupId: "dashboard-payments" },
    },
  ],
};
