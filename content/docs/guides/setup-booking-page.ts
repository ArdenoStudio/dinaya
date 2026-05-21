import type { DocsGuide } from "../types";

export const setupBookingPageGuide: DocsGuide = {
  slug: "setup-booking-page",
  title: "Set up your booking page",
  description: "Go from sign-up to a live booking link in about five minutes.",
  category: "getting-started",
  estimatedMinutes: 5,
  relatedGuides: ["add-services", "manage-availability", "share-booking-link"],
  faqIds: ["create-booking-page", "customise-page"],
  steps: [
    {
      title: "Create your account",
      body: "Go to dinaya.lk/register and complete the two-step sign-up: your name and email, then your business name and type. Dinaya seeds example services based on your business type so you are not starting from zero.",
      visual: { type: "mockup", mockupId: "dashboard-onboarding" },
      hotspots: [{ x: 72, y: 35, label: "Register", showCursor: true }],
    },
    {
      title: "Complete business info",
      body: "On your dashboard, open the setup wizard and add your business photo, description, and contact details. These appear on your public booking page immediately.",
      visual: { type: "mockup", mockupId: "dashboard-onboarding" },
      hotspots: [{ x: 55, y: 28, label: "Business info", showCursor: true }],
    },
    {
      title: "Add your first service",
      body: "Go to Dashboard → Services. Set the name, duration, price, and optional deposit. You can add more services anytime.",
      visual: { type: "mockup", mockupId: "dashboard-services" },
      hotspots: [{ x: 18, y: 52, label: "Services", showCursor: true }],
    },
    {
      title: "Set availability",
      body: "Open Dashboard → Availability and define your weekly working hours. Block holidays so clients cannot book days you are closed.",
      visual: { type: "mockup", mockupId: "dashboard-availability" },
      hotspots: [{ x: 18, y: 68, label: "Availability", showCursor: true }],
    },
    {
      title: "Connect PayHere (optional)",
      body: "If you want online deposits or full payment, connect PayHere from Settings. You can go live without payments and turn this on later.",
      visual: { type: "mockup", mockupId: "dashboard-payhere" },
      hotspots: [{ x: 18, y: 88, label: "Settings", showCursor: true }],
    },
    {
      title: "Share your link",
      body: "Your page is live at yourname.dinaya.lk. Copy the link from Marketing or the setup wizard and share it on WhatsApp, Instagram, or print it on a card.",
      visual: { type: "mockup", mockupId: "dashboard-marketing" },
      hotspots: [{ x: 55, y: 40, label: "Booking link", showCursor: true }],
    },
  ],
};
