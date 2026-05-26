import type { DocsGuide } from "../types";

export const aiHubOverviewGuide: DocsGuide = {
  slug: "ai-hub-overview",
  title: "AI Hub overview",
  description: "Eight AI workflows to grow bookings, reviews, repeat visits, and flash deals.",
  category: "growth",
  estimatedMinutes: 10,
  planRequired: "max",
  relatedGuides: ["automations", "upgrade-plan", "dinaya-deals"],
  steps: [
    {
      title: "Open AI Hub",
      body: "Max plans include AI Hub under Dashboard → AI. Each workflow runs on a schedule in the background.",
      visual: { type: "mockup", mockupId: "dashboard-ai" },
      highlightNav: "AI Hub",
    },
    {
      title: "Booking autopilot",
      body: "Fills slow days by nudging past clients with rebooking prompts based on your calendar gaps.",
      visual: { type: "mockup", mockupId: "dashboard-ai" },
    },
    {
      title: "Smart reminders",
      body: "Optimizes reminder timing across email, SMS, and WhatsApp to reduce no-shows.",
      visual: { type: "mockup", mockupId: "dashboard-ai" },
    },
    {
      title: "Review engine",
      body: "Automatically asks happy clients for reviews and routes negative feedback privately.",
      visual: { type: "mockup", mockupId: "dashboard-ai" },
    },
    {
      title: "Client reactivation",
      body: "Re-engages clients who have not booked in a while with personalized messages.",
      visual: { type: "mockup", mockupId: "dashboard-ai" },
    },
    {
      title: "Upsell assistant",
      body: "Suggests add-on services to clients based on their booking history.",
      visual: { type: "mockup", mockupId: "dashboard-ai" },
    },
    {
      title: "Content machine & loyalty",
      body: "Drafts social posts for your business and runs VIP loyalty sequences for top clients.",
      visual: { type: "mockup", mockupId: "dashboard-ai" },
    },
    {
      title: "Smart deal suggestions",
      body: "Detects calendar gaps and recommends flash discounts you can publish as Dinaya Deals.",
      visual: { type: "mockup", mockupId: "dashboard-ai" },
    },
  ],
};
