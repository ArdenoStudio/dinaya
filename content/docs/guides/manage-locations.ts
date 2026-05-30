import type { DocsGuide } from "../types";

export const manageLocationsGuide: DocsGuide = {
  slug: "manage-locations",
  title: "Manage locations",
  description: "Add branches so clients pick the right shop when booking.",
  category: "catalog",
  estimatedMinutes: 4,
  relatedGuides: ["add-staff-availability", "upgrade-plan"],
  faqIds: ["multi-staff-locations"],
  steps: [
    {
      title: "Open Locations",
      body: "Starter and Pro include 1 branch. Growth supports 3 branches; Managed Max can be customized. Go to Dashboard → Locations.",
      visual: { type: "mockup", mockupId: "dashboard-locations" },
      highlightNav: "Locations",
    },
    {
      title: "Add a branch",
      body: "Enter branch name, address, and hours. Each location can have its own staff and services.",
      visual: { type: "mockup", mockupId: "dashboard-locations" },
    },
    {
      title: "Client booking",
      body: "Clients choose a location as the first step on your booking page when you have multiple branches.",
      visual: { type: "mockup", mockupId: "booking-service" },
    },
    {
      title: "Per-branch AI (Growth)",
      body: "On Growth and Managed Max, configure AI Hub settings separately per branch.",
      visual: { type: "mockup", mockupId: "dashboard-locations" },
    },
  ],
};
