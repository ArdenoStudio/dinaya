import type { DocsGuide } from "../types";

export const dashboardCalendarGuide: DocsGuide = {
  slug: "dashboard-calendar",
  title: "Use the calendar",
  description: "See your week at a glance and jump into bookings quickly.",
  category: "workspace",
  estimatedMinutes: 3,
  relatedGuides: ["manage-bookings"],
  steps: [
    {
      title: "Open Calendar",
      body: "Dashboard → Calendar shows all appointments by day and staff. Click any slot to view or edit the booking.",
      visual: { type: "mockup", mockupId: "dashboard-calendar" },
      hotspots: [{ x: 18, y: 32, label: "Calendar", showCursor: true }],
    },
    {
      title: "Switch views",
      body: "Move between week and day views to plan your schedule. Staff filters help in multi-person teams.",
      visual: { type: "mockup", mockupId: "dashboard-calendar" },
    },
    {
      title: "Create from calendar",
      body: "Click an empty slot to start a new booking without leaving the calendar.",
      visual: { type: "mockup", mockupId: "dashboard-calendar" },
    },
  ],
};
