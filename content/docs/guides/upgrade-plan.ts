import type { DocsGuide } from "../types";

export const upgradePlanGuide: DocsGuide = {
  slug: "upgrade-plan",
  title: "Upgrade your plan",
  description: "Move from trial or Starter to Pro, Growth, or Managed Max.",
  category: "team",
  estimatedMinutes: 3,
  relatedGuides: ["ai-hub-overview", "manage-locations"],
  faqIds: ["is-free", "multi-staff-locations"],
  steps: [
    {
      title: "Compare plans",
      body: "Visit dinaya.lk/pricing to compare Starter, Pro, Growth, and Managed Max — reminders, AI, branches, custom domain, and setup help.",
      visual: { type: "mockup", mockupId: "dashboard-billing" },
    },
    {
      title: "Open Billing",
      body: "In your dashboard, go to Settings → Billing. Choose monthly or annual billing for Starter, Pro, or Growth.",
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
