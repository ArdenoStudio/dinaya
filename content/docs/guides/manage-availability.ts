import type { DocsGuide } from "../types";

export const manageAvailabilityGuide: DocsGuide = {
  slug: "manage-availability",
  title: "Manage availability & holidays",
  description: "Set working hours, block time off, and prevent double bookings.",
  category: "catalog",
  estimatedMinutes: 4,
  relatedGuides: ["add-services", "add-staff-availability"],
  faqIds: ["manage-availability", "block-holidays"],
  steps: [
    {
      title: "Open Availability",
      body: "From your dashboard sidebar, click Availability. This controls which days and times appear on your public booking page.",
      visual: { type: "mockup", mockupId: "dashboard-availability" },
      highlightNav: "Availability",
    },
    {
      title: "Set weekly hours",
      body: "Choose which days you work and set open/close times for each day. Changes apply immediately — clients only see open slots.",
      visual: { type: "mockup", mockupId: "dashboard-availability" },
      hotspots: [{ x: 58, y: 48, label: "Weekly hours", showCursor: true }],
    },
    {
      title: "Block holidays",
      body: "Add blocked date ranges for holidays or personal time off. Blocked dates are hidden from your booking page entirely.",
      visual: { type: "mockup", mockupId: "dashboard-availability" },
      hotspots: [{ x: 58, y: 62, label: "Blocked dates", showCursor: true }],
    },
    {
      title: "Per-staff schedules",
      body: "If you have multiple staff, assign each person their own hours under Staff, then link them to services. Clients pick staff when booking (if you enable it).",
      visual: { type: "mockup", mockupId: "dashboard-staff" },
      highlightNav: "Staff",
    },
  ],
};
