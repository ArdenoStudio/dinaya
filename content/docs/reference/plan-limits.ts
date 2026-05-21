import type { ReferencePage } from "../types";

export const planLimitsReference: ReferencePage = {
  slug: "plan-limits",
  title: "Plan limits & features",
  description: "What is included in Free, Pro, and Max plans.",
  sections: [
    {
      heading: "Free",
      body: "1 staff member, up to 5 services, 1 location, public booking page, basic reviews, and email reminders. No AI Hub, automations, or custom domain.",
    },
    {
      heading: "Pro",
      body: "Everything in Free plus AI Hub, automations, up to 3 locations, multi-staff, custom domain, branding removal, reports, webhooks, WhatsApp/SMS, and Google Calendar sync.",
    },
    {
      heading: "Max",
      body: "Everything in Pro plus unlimited locations and per-branch AI controls.",
    },
    {
      heading: "Bookings",
      body: "All plans include unlimited bookings per month. Dinaya never charges commission on bookings.",
    },
    {
      heading: "Payments",
      body: "Dinaya charges zero transaction fees. PayHere applies their standard gateway rates on card payments.",
    },
  ],
};
