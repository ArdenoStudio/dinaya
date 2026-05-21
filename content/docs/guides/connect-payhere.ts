import type { DocsGuide } from "../types";

export const connectPayhereGuide: DocsGuide = {
  slug: "connect-payhere",
  title: "Connect PayHere & collect deposits",
  description: "Accept card payments and deposits through Sri Lanka's trusted gateway.",
  category: "growth",
  estimatedMinutes: 5,
  relatedGuides: ["add-services", "dashboard-payments"],
  faqIds: ["online-payments", "deposit", "payment-fees"],
  steps: [
    {
      title: "Get PayHere credentials",
      body: "Sign up at payhere.lk if you do not have a merchant account. You will need your Merchant ID and Merchant Secret from the PayHere dashboard.",
      visual: { type: "mockup", mockupId: "dashboard-payhere" },
    },
    {
      title: "Open payment settings",
      body: "In Dinaya, go to Dashboard → Settings and find the PayHere section. Paste your credentials and choose sandbox or live mode.",
      visual: { type: "mockup", mockupId: "dashboard-payhere" },
      highlightNav: "Settings",
    },
    {
      title: "Set deposit rules per service",
      body: "Go to Services → edit a service. Choose no payment, fixed deposit, percentage deposit, or full payment upfront.",
      visual: { type: "mockup", mockupId: "dashboard-services" },
      highlightNav: "Services",
      hotspots: [{ x: 58, y: 72, label: "Deposit option", showCursor: true }],
    },
    {
      title: "Test a booking",
      body: "Open your booking page in a private browser window and complete a test booking with PayHere sandbox before going live.",
      visual: { type: "mockup", mockupId: "booking-confirm" },
      hotspots: [{ x: 50, y: 78, label: "Confirm & Pay", showCursor: true }],
    },
    {
      title: "Track payments",
      body: "View payment status, deposits, and refunds under Dashboard → Payments and on each booking detail page.",
      visual: { type: "mockup", mockupId: "dashboard-payments" },
      highlightNav: "Payments",
    },
  ],
};
