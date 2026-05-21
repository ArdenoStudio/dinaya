import type { DocsGuide } from "../types";

export const upgradePlanGuide: DocsGuide = {
  slug: "upgrade-plan",
  title: "Upgrade your plan",
  description: "Move from Free to Pro or Max for advanced features.",
  category: "team",
  estimatedMinutes: 3,
  relatedGuides: ["ai-hub-overview", "manage-locations"],
  faqIds: ["is-free", "multi-staff-locations"],
  steps: [
    {
      title: "Compare plans",
      body: "Visit dinaya.lk/pricing to see what is included in Free, Pro, and Max — AI, multi-location, custom domain, and more.",
      visual: { type: "mockup", mockupId: "dashboard-billing" },
    },
    {
      title: "Open Billing",
      body: "In your dashboard, go to Settings → Billing. Choose monthly or annual billing for Pro or Max.",
      visual: { type: "mockup", mockupId: "dashboard-billing" },
      highlightNav: "Settings",
    },
    {
      title: "Pay with PayHere",
      body: "Complete checkout through PayHere. Your new features unlock immediately after payment confirms.",
      visual: { type: "mockup", mockupId: "dashboard-billing" },
      highlightTarget: "billing-upgrade",
    },
  ],
};
