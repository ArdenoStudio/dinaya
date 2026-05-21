import type { DocsGuide } from "../types";

export const addServicesGuide: DocsGuide = {
  slug: "add-services",
  title: "Add & edit services",
  description: "Build your service menu with pricing, deposits, and buffer time.",
  category: "catalog",
  estimatedMinutes: 4,
  relatedGuides: ["connect-payhere", "manage-availability"],
  faqIds: ["buffer-time"],
  steps: [
    {
      title: "Open Services",
      body: "Go to Dashboard → Services to see your catalog. Free plans include up to 5 services.",
      visual: { type: "mockup", mockupId: "dashboard-services" },
      hotspots: [{ x: 18, y: 52, label: "Services", showCursor: true }],
    },
    {
      title: "Add a service",
      body: "Click Add service. Enter name, duration, price in LKR, and optional description shown to clients.",
      visual: { type: "mockup", mockupId: "dashboard-services" },
      hotspots: [{ x: 55, y: 72, label: "+ Add service", showCursor: true }],
    },
    {
      title: "Buffer time",
      body: "Set buffer minutes after each appointment so cleanup or travel time is protected before the next slot opens.",
      visual: { type: "mockup", mockupId: "dashboard-services" },
    },
    {
      title: "Deposits",
      body: "Configure deposit type per service once PayHere is connected — fixed amount, percentage, or full payment.",
      visual: { type: "mockup", mockupId: "dashboard-services" },
    },
  ],
};
