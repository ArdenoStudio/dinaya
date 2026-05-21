import type { DocsGuide } from "../types";

export const addStaffAvailabilityGuide: DocsGuide = {
  slug: "add-staff-availability",
  title: "Add staff & schedules",
  description: "Run a multi-person team with individual calendars.",
  category: "catalog",
  estimatedMinutes: 5,
  relatedGuides: ["manage-availability", "manage-locations"],
  steps: [
    {
      title: "Add staff members",
      body: "Go to Dashboard → Staff → Add staff. Enter name, role, and optional photo.",
      visual: { type: "mockup", mockupId: "dashboard-staff" },
      highlightNav: "Staff",
    },
    {
      title: "Assign services",
      body: "Link each staff member to the services they perform so clients can pick the right person when booking.",
      visual: { type: "mockup", mockupId: "dashboard-staff" },
    },
    {
      title: "Set individual hours",
      body: "Define weekly availability per staff member. Overrides and holidays can be set per person.",
      visual: { type: "mockup", mockupId: "dashboard-availability" },
    },
    {
      title: "Invite team members",
      body: "Send an email invite so staff can log in to their own dashboard view. They accept via the invite link.",
      visual: { type: "mockup", mockupId: "dashboard-staff" },
    },
    {
      title: "Client booking flow",
      body: "On your booking page, clients choose staff (if enabled) before picking a time slot.",
      visual: { type: "mockup", mockupId: "booking-service" },
    },
  ],
};
