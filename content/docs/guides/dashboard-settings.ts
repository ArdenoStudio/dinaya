import type { DocsGuide } from "../types";

export const dashboardSettingsGuide: DocsGuide = {
  slug: "dashboard-settings",
  title: "Business settings",
  description: "Update your profile, booking policies, and account.",
  category: "configure",
  estimatedMinutes: 4,
  relatedGuides: ["upgrade-plan"],
  faqIds: ["change-business", "change-slug", "delete-account"],
  steps: [
    {
      title: "Open Settings",
      body: "Dashboard → Settings holds your business profile, notifications, and account options.",
      visual: { type: "mockup", mockupId: "dashboard-settings" },
      hotspots: [{ x: 18, y: 88, label: "Settings", showCursor: true }],
    },
    {
      title: "Business profile",
      body: "Update name, photo, description, and contact info. Changes sync to your public booking page.",
      visual: { type: "mockup", mockupId: "dashboard-settings" },
    },
    {
      title: "Booking policies",
      body: "Set cancellation rules, minimum notice, and what clients see at checkout.",
      visual: { type: "mockup", mockupId: "dashboard-settings" },
    },
    {
      title: "Account & slug",
      body: "Change your booking link once from Account settings. Delete account removes all data permanently.",
      visual: { type: "mockup", mockupId: "dashboard-settings" },
    },
  ],
};
