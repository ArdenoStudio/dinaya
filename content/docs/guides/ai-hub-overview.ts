import type { DocsGuide } from "../types";

export const aiHubOverviewGuide: DocsGuide = {
  slug: "ai-hub-overview",
  title: "AI Hub overview",
  description: "Seven AI workflows to grow bookings, reviews, and repeat visits.",
  category: "growth",
  estimatedMinutes: 10,
  planRequired: "pro",
  relatedGuides: ["automations", "upgrade-plan"],
  steps: [
    {
      title: "Open AI Hub",
      body: "Pro and Max plans include AI Hub under Dashboard → AI. Each workflow runs on a schedule in the background.",
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
  ],
};
