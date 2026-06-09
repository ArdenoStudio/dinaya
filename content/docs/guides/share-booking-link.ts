import type { DocsGuide } from "../types";

export const shareBookingLinkGuide: DocsGuide = {
  slug: "share-booking-link",
  title: "Share your booking link",
  description: "Put your Dinaya link everywhere clients find you.",
  category: "growth",
  estimatedMinutes: 4,
  thumbnailMockupId: "dashboard-marketing",
  relatedGuides: ["setup-booking-page", "collect-reviews"],
  faqIds: ["share-link"],
  steps: [
    {
      title: "Find your link",
      body: "Go to Dashboard → Marketing. Your booking URL is shown at the top — usually yourname.dinaya.lk. Copy it with one click.",
      visual: { type: "mockup", mockupId: "dashboard-marketing" },
      highlightNav: "Marketing",
    },
    {
      title: "WhatsApp & Instagram",
      body: "Paste the link in your Instagram bio, WhatsApp business description, or send it directly to clients. Dinaya includes a one-tap WhatsApp share button.",
      visual: { type: "mockup", mockupId: "dashboard-marketing" },
      highlightTarget: "marketing-whatsapp",
    },
    {
      title: "QR code",
      body: "Download the QR code from Marketing and print it on receipts, signage, or business cards. Scanning opens your booking page instantly.",
      visual: { type: "mockup", mockupId: "dashboard-marketing" },
      highlightTarget: "marketing-qr-code",
    },
    {
      title: "Embed on your website",
      body: "Copy the embed snippet to add a Book now button on your website. The widget opens your Dinaya booking flow in a popup.",
      visual: { type: "mockup", mockupId: "dashboard-marketing" },
      highlightTarget: "marketing-embed",
    },
  ],
};
