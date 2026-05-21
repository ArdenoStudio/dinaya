import type { DocsGuide } from "../types";

export const manageBookingsGuide: DocsGuide = {
  slug: "manage-bookings",
  title: "Manage bookings",
  description: "View, create, cancel, reschedule, and refund appointments.",
  category: "workspace",
  estimatedMinutes: 6,
  relatedGuides: ["dashboard-calendar", "client-manage-booking"],
  faqIds: ["client-books", "cancel-reschedule", "refund"],
  steps: [
    {
      title: "Open Bookings",
      body: "Go to Dashboard → Bookings to see upcoming and past appointments. Use filters to find a specific client or date.",
      visual: { type: "mockup", mockupId: "dashboard-bookings" },
      hotspots: [{ x: 18, y: 38, label: "Bookings", showCursor: true }],
    },
    {
      title: "Create a manual booking",
      body: "Click New booking to add an appointment yourself — useful for phone or walk-in clients. Pick service, staff, time, and client details.",
      visual: { type: "mockup", mockupId: "dashboard-bookings" },
      hotspots: [{ x: 70, y: 18, label: "New booking", showCursor: true }],
    },
    {
      title: "Open a booking",
      body: "Click any row to open the full booking detail: client contact, payment status, notes, and actions.",
      visual: { type: "mockup", mockupId: "dashboard-bookings" },
      hotspots: [{ x: 55, y: 42, label: "Booking row", showCursor: true }],
    },
    {
      title: "Reschedule",
      body: "Choose Reschedule, pick a new date and time, and save. The client receives an updated confirmation email automatically.",
      visual: { type: "mockup", mockupId: "dashboard-bookings" },
      hotspots: [{ x: 75, y: 55, label: "Reschedule", showCursor: true }],
    },
    {
      title: "Cancel",
      body: "Cancel removes the appointment from your calendar and notifies the client. Cancel upcoming bookings before deleting your account.",
      visual: { type: "mockup", mockupId: "dashboard-bookings" },
      hotspots: [{ x: 75, y: 62, label: "Cancel", showCursor: true }],
    },
    {
      title: "Refund a payment",
      body: "For paid bookings, use Refund on the booking detail page. Full or partial refunds go through PayHere in 5–7 working days.",
      visual: { type: "mockup", mockupId: "dashboard-bookings" },
      hotspots: [{ x: 75, y: 70, label: "Refund", showCursor: true }],
    },
  ],
};
