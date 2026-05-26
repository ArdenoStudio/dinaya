import type { DocsGuide } from "../types";

export const dinayaDealsGuide: DocsGuide = {
  slug: "dinaya-deals",
  title: "Dinaya Deals",
  description: "Post flash discounts on slow slots and fill your calendar from Discover and direct booking links.",
  category: "growth",
  estimatedMinutes: 5,
  planRequired: "pro",
  relatedGuides: ["discover-directory", "dashboard-reports", "ai-hub-overview"],
  steps: [
    {
      title: "Create a deal",
      body: "Open Dashboard → Deals → New deal. Choose the service, discount (10–50%), slot count, claim window, and appointment window.",
    },
    {
      title: "Get discovered",
      body: "Listed businesses appear on dinaya.lk/discover. Share your booking link with ?dealId= for direct campaigns.",
      visual: { type: "mockup", mockupId: "dashboard-marketing" },
      highlightTarget: "marketing-directory",
    },
    {
      title: "Track performance",
      body: "View aggregate deal analytics on Dashboard → Reports. Each deal shows impressions, redemptions, and conversion on the Deals page.",
      highlightNav: "Reports",
    },
    {
      title: "Smart suggestions (Max)",
      body: "Max plans receive AI deal suggestions when the calendar has long gaps. Publish in one click or customize before sending.",
    },
  ],
};
