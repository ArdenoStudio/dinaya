import type { DocsGuide } from "../types";

export const dashboardReportsGuide: DocsGuide = {
  slug: "dashboard-reports",
  title: "Reports & analytics",
  description: "Understand revenue, bookings, and trends over time.",
  category: "growth",
  estimatedMinutes: 3,
  planRequired: "pro",
  relatedGuides: ["dashboard-payments"],
  steps: [
    {
      title: "Open Reports",
      body: "Pro and Max plans include Dashboard → Reports with charts for revenue, bookings, and top services.",
      visual: { type: "mockup", mockupId: "dashboard-payments" },
      hotspots: [{ x: 18, y: 82, label: "Reports", showCursor: true }],
    },
    {
      title: "Date ranges",
      body: "Filter by week, month, or custom range to compare performance.",
      visual: { type: "mockup", mockupId: "dashboard-payments" },
    },
    {
      title: "Export insights",
      body: "Use reports to decide staffing, pricing, and which services to promote.",
      visual: { type: "mockup", mockupId: "dashboard-payments" },
    },
  ],
};
