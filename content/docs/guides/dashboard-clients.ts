import type { DocsGuide } from "../types";

export const dashboardClientsGuide: DocsGuide = {
  slug: "dashboard-clients",
  title: "Client CRM",
  description: "Track client history, notes, tags, and stages in one place.",
  category: "workspace",
  estimatedMinutes: 4,
  relatedGuides: ["manage-bookings"],
  steps: [
    {
      title: "Open Clients",
      body: "Dashboard → Clients lists everyone who has booked. Search by name, phone, or email.",
      visual: { type: "mockup", mockupId: "dashboard-clients" },
      highlightNav: "Clients",
    },
    {
      title: "Client profile",
      body: "Open a client to see booking history, total spend, and contact details.",
      visual: { type: "mockup", mockupId: "dashboard-clients" },
    },
    {
      title: "Notes & tags",
      body: "Add private notes and tags to organize VIPs, allergies, or preferences.",
      visual: { type: "mockup", mockupId: "dashboard-clients" },
    },
    {
      title: "Pipeline stages",
      body: "Move clients through stages like New, Active, or Lapsed for follow-up workflows.",
      visual: { type: "mockup", mockupId: "dashboard-clients" },
    },
  ],
};
