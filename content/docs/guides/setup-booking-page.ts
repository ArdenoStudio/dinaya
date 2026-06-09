import type { DocsGuide } from "../types";

export const setupBookingPageGuide: DocsGuide = {
  slug: "setup-booking-page",
  title: "Set up your booking page",
  description: "Go from sign-up to a live booking link in about five minutes.",
  category: "getting-started",
  estimatedMinutes: 5,
  thumbnailMockupId: "dashboard-onboarding",
  relatedGuides: ["add-services", "manage-availability", "share-booking-link"],
  faqIds: ["create-booking-page", "customise-page"],
  steps: [
    {
      title: "Create your account",
      body: "Go to dinaya.lk/register and complete the two-step sign-up: your name and email, then your business name and type. Dinaya seeds example services based on your business type so you are not starting from zero.",
      visual: { type: "mockup", mockupId: "dashboard-onboarding" },
    },
    {
      title: "Complete business info",
      body: "On your dashboard, open the setup wizard and add your business photo, description, and contact details. These appear on your public booking page immediately.",
      visual: { type: "mockup", mockupId: "dashboard-onboarding" },
      highlightTarget: "onboarding-business-info",
    },
    {
      title: "Add your first service",
      body: "Go to Dashboard → Services. Set the name, duration, price, and optional deposit. You can add more services anytime.",
      visual: { type: "mockup", mockupId: "dashboard-services" },
      highlightNav: "Services",
    },
    {
      title: "Set availability",
      body: "Open Dashboard → Availability and define your weekly working hours. Block holidays so clients cannot book days you are closed.",
      visual: { type: "mockup", mockupId: "dashboard-availability" },
      highlightNav: "Availability",
    },
    {
      title: "Connect PayHere (optional)",
      body: "If you want online deposits or full payment, connect PayHere from Settings. You can go live without payments and turn this on later.",
      visual: { type: "mockup", mockupId: "dashboard-payhere" },
      highlightNav: "Settings",
    },
    {
      title: "Share your link",
      body: "Your page is live at yourname.dinaya.lk. Copy the link from Marketing or the setup wizard and share it on WhatsApp, Instagram, or print it on a card.",
      visual: { type: "mockup", mockupId: "dashboard-marketing" },
      highlightNav: "Marketing",
      highlightTarget: "marketing-booking-link",
    },
  ],
};
