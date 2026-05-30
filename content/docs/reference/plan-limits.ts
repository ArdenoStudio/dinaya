import type { ReferencePage } from "../types";

export const planLimitsReference: ReferencePage = {
  slug: "plan-limits",
  title: "Plan limits & features",
  description: "What is included in Starter, Pro, Growth, and Managed Max plans.",
  sections: [
    {
      heading: "Starter",
      body: "1 branch, 2 staff, up to 10 services, public booking page, PayHere payments, unlimited bookings, email confirmations, and basic deposits, clients, and reports.",
    },
    {
      heading: "Pro",
      body: "Everything in Starter plus 5 staff, unlimited services, reviews, advanced reports, Google Calendar sync, basic automations, webhooks, WhatsApp/SMS reminder credits, and WhatsApp support.",
    },
    {
      heading: "Growth",
      body: "Everything in Pro plus 3 branches, 15 staff, custom domain, branding removal, full automations, AI review replies, AI reactivation, AI content, smart deal suggestions, and AI Voice Receptionist setup eligibility.",
    },
    {
      heading: "Managed Max",
      body: "Everything in Growth plus custom limits, setup help, data migration, managed onboarding, and managed AI Voice Receptionist setup.",
    },
    {
      heading: "Bookings",
      body: "All plans include unlimited bookings per month. Dinaya never charges commission on bookings.",
    },
    {
      heading: "Payments",
      body: "Dinaya charges zero transaction fees. PayHere applies their standard gateway rates on card payments.",
    },
    {
      heading: "Trial",
      body: "New accounts get a 14-day free trial with Starter and Pro tools plus a limited Growth preview. Custom domains, voice receptionist setup, and unlimited messaging are not included in the trial.",
    },
  ],
};
