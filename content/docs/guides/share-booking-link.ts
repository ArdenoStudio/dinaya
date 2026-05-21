import type { DocsGuide } from "../types";

export const shareBookingLinkGuide: DocsGuide = {
  slug: "share-booking-link",
  title: "Share your booking link",
  description: "Put your Dinaya link everywhere clients find you.",
  category: "growth",
  estimatedMinutes: 4,
  relatedGuides: ["setup-booking-page", "collect-reviews"],
  faqIds: ["share-link"],
  steps: [
    {
      title: "Find your link",
      body: "Go to Dashboard → Marketing. Your booking URL is shown at the top — usually yourname.dinaya.lk. Copy it with one click.",
      visual: { type: "mockup", mockupId: "dashboard-marketing" },
      hotspots: [{ x: 18, y: 72, label: "Marketing", showCursor: true }],
    },
    {
      title: "WhatsApp & Instagram",
      body: "Paste the link in your Instagram bio, WhatsApp business description, or send it directly to clients. Dinaya includes a one-tap WhatsApp share button.",
      visual: { type: "mockup", mockupId: "dashboard-marketing" },
      hotspots: [{ x: 65, y: 58, label: "WhatsApp share", showCursor: true }],
    },
    {
      title: "QR code",
      body: "Download the QR code from Marketing and print it on receipts, signage, or business cards. Scanning opens your booking page instantly.",
      visual: { type: "mockup", mockupId: "dashboard-marketing" },
      hotspots: [{ x: 40, y: 58, label: "QR code", showCursor: true }],
    },
    {
      title: "Embed on your website",
      body: "Copy the embed snippet to add a Book now button on your website. The widget opens your Dinaya booking flow in a popup.",
      visual: { type: "mockup", mockupId: "dashboard-marketing" },
      hotspots: [{ x: 55, y: 70, label: "Embed code", showCursor: true }],
    },
  ],
};
