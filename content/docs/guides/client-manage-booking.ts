import type { DocsGuide } from "../types";

export const clientManageBookingGuide: DocsGuide = {
  slug: "client-manage-booking",
  title: "Client self-service portal",
  description: "Let clients reschedule or cancel without calling you.",
  category: "clients",
  estimatedMinutes: 3,
  relatedGuides: ["manage-bookings", "client-books-online"],
  steps: [
    {
      title: "Manage link in email",
      body: "After booking, clients receive a confirmation email with a secure manage link — no login required.",
      visual: { type: "mockup", mockupId: "booking-manage" },
    },
    {
      title: "View appointment",
      body: "The portal shows service, time, location, and business contact details.",
      visual: { type: "mockup", mockupId: "booking-manage" },
    },
    {
      title: "Reschedule or cancel",
      body: "Clients tap Reschedule to pick a new slot, or Cancel if your policy allows it. You are notified by email.",
      visual: { type: "mockup", mockupId: "booking-manage" },
      hotspots: [
        { x: 30, y: 62, label: "Reschedule", showCursor: true },
        { x: 70, y: 62, label: "Cancel", showCursor: false },
      ],
    },
  ],
};
