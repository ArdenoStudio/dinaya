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
      body: "Free includes 1 location. Pro supports 3; Max is unlimited. Go to Dashboard → Locations.",
      visual: { type: "mockup", mockupId: "dashboard-locations" },
      hotspots: [{ x: 18, y: 62, label: "Locations", showCursor: true }],
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
      title: "Per-branch AI (Max)",
      body: "On Max, configure AI Hub settings separately per branch.",
      visual: { type: "mockup", mockupId: "dashboard-locations" },
    },
  ],
};
