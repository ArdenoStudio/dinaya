import type { DocsGuide } from "../types";

export const acceptStaffInviteGuide: DocsGuide = {
  slug: "accept-staff-invite",
  title: "Accept a staff invite",
  description: "Join a business team as staff from an email invite.",
  category: "team",
  estimatedMinutes: 3,
  relatedGuides: ["add-staff-availability"],
  faqIds: ["reset-password"],
  steps: [
    {
      title: "Open the invite link",
      body: "Click the link in your invite email. It opens dinaya.lk/accept-invite with the business name pre-filled.",
      visual: { type: "mockup", mockupId: "dashboard-staff" },
    },
    {
      title: "Create or sign in",
      body: "If you already have a Dinaya account, sign in. Otherwise create an account with your email and password.",
      visual: { type: "mockup", mockupId: "dashboard-staff" },
    },
    {
      title: "Access the dashboard",
      body: "After accepting, you see the business dashboard with permissions set by the owner.",
      visual: { type: "mockup", mockupId: "dashboard-overview" },
    },
  ],
};
