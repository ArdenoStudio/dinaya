import type { DocsGuide } from "../types";

export const clientBooksOnlineGuide: DocsGuide = {
  slug: "client-books-online",
  title: "How clients book online",
  description: "What your customers see and do on your public booking page.",
  category: "clients",
  estimatedMinutes: 5,
  relatedGuides: ["connect-payhere", "client-manage-booking"],
  faqIds: ["client-account", "double-booked"],
  steps: [
    {
      title: "Open your booking page",
      body: "Clients visit yourname.dinaya.lk (or your custom domain on Pro). No account or app download is required.",
      visual: { type: "mockup", mockupId: "booking-service" },
    },
    {
      title: "Choose a service",
      body: "They pick a service, see duration and price, and continue. If you have multiple locations or staff, they choose those first.",
      visual: { type: "mockup", mockupId: "booking-service" },
      hotspots: [{ x: 50, y: 42, label: "Select service", showCursor: true }],
    },
    {
      title: "Pick date & time",
      body: "Available slots reflect your real-time calendar. When a slot is chosen, it is reserved immediately — no double bookings.",
      visual: { type: "mockup", mockupId: "booking-time" },
      hotspots: [{ x: 50, y: 48, label: "Time slot", showCursor: true }],
    },
    {
      title: "Enter details & pay",
      body: "Clients enter name, phone, and email. If payments are enabled, they pay a deposit or full amount via PayHere.",
      visual: { type: "mockup", mockupId: "booking-confirm" },
      hotspots: [{ x: 50, y: 72, label: "Confirm & Pay", showCursor: true }],
    },
    {
      title: "Confirmation & reminders",
      body: "Both you and the client receive confirmation emails. Reminders go out before the appointment so fewer no-shows.",
      visual: { type: "mockup", mockupId: "booking-confirm" },
    },
  ],
};
