export const starterFeatures = [
  "Public booking page",
  "yourname.dinaya.lk subdomain",
  "PayHere payments",
  "Unlimited bookings",
  "1 branch, 2 staff, 10 services",
  "Email confirmations",
  "Basic deposits, clients, and reports",
];

export const proFeatures = [
  "Everything in Starter",
  "1 branch, 5 staff, unlimited services",
  "SMS/WhatsApp reminder credits",
  "Google Calendar sync",
  "Reviews and advanced reports",
  "Basic automations",
  "WhatsApp support",
];

export const growthFeatures = [
  "Everything in Pro",
  "3 branches and 15 staff",
  "Custom domain",
  "Remove Dinaya branding",
  "Full automations",
  "AI review replies, reactivation, and content",
  "AI Voice Receptionist coming soon",
];

export const managedFeatures = [
  "Everything in Growth",
  "Custom branches, staff, and setup",
  "Managed onboarding and migration",
  "Voice receptionist rollout waitlist",
  "Priority WhatsApp and setup help",
  "Done-for-you optimization",
];

export const addOns = [
  ["Extra branch", "LKR 1,500/mo each"],
  ["Extra staff pack, 5 users", "LKR 1,000/mo"],
  ["SMS/WhatsApp top-up", "Usage-based"],
  ["Custom domain setup help", "LKR 5,000 one-time"],
  ["Data migration", "From LKR 10,000"],
  ["AI Voice Receptionist", "Coming soon"],
  ["Managed onboarding", "From LKR 15,000 one-time"],
] as const;

export const comparisonRows = [
  ["Public booking page", "Yes", "Yes", "Yes", "Yes"],
  ["yourname.dinaya.lk subdomain", "Yes", "Yes", "Yes", "Yes"],
  ["PayHere payments", "Yes", "Yes", "Yes", "Yes"],
  ["Bookings", "Unlimited", "Unlimited", "Unlimited", "Unlimited"],
  ["Branches", "1", "1", "3", "Custom"],
  ["Staff", "2", "5", "15", "Custom"],
  ["Services", "10", "Unlimited", "Unlimited", "Unlimited"],
  ["Email confirmations", "Yes", "Yes", "Yes", "Yes"],
  ["SMS/WhatsApp reminders", "No", "Credits", "Higher credits", "Custom"],
  ["Deposits / full payments", "Basic", "Yes", "Yes", "Yes"],
  ["Client database", "Basic", "Yes", "Yes", "Yes"],
  ["Reviews", "No", "Yes", "Yes", "Yes"],
  ["Reports", "Basic", "Advanced", "Advanced", "Custom"],
  ["Custom domain", "No", "No", "Yes", "Yes"],
  ["Remove Dinaya branding", "No", "No", "Yes", "Yes"],
  ["Google Calendar sync", "No", "Yes", "Yes", "Yes"],
  ["Automations", "No", "Basic", "Full", "Full"],
  ["AI review replies", "No", "No", "Yes", "Yes"],
  ["AI reactivation", "No", "No", "Yes", "Yes"],
  ["AI content machine", "No", "No", "Yes", "Yes"],
  ["AI voice receptionist", "Coming soon", "Coming soon", "Coming soon", "Coming soon"],
  ["Support", "Email/WhatsApp basic", "WhatsApp", "Priority WhatsApp", "Priority + setup help"],
] as const;

export const faqs = [
  {
    q: "How does the free trial work?",
    a: "Every new business gets 14 days to try Dinaya without a card. The trial includes Starter and Pro tools, plus a limited Growth preview. Custom domains and unlimited messaging are not included in the trial; voice receptionist is coming in a later rollout.",
  },
  {
    q: "Which plan should most businesses choose?",
    a: "Pro is the main plan. Starter keeps the entry price realistic, Growth is for businesses that want automation and AI follow-up, and Managed Max is for setup-heavy or multi-branch work.",
  },
  {
    q: "Are there transaction fees?",
    a: "Dinaya does not take a commission on your bookings. PayHere card fees are charged by PayHere directly. SMS and WhatsApp usage beyond included credits is handled as a top-up.",
  },
  {
    q: "Can I switch plans later?",
    a: "Yes. You can move from Starter to Pro or Growth from billing. Managed Max is handled with the Dinaya team because it usually includes setup or migration work.",
  },
  {
    q: "Do you offer refunds?",
    a: "The trial is free, so there is nothing to refund. For paid plans and add-ons, see our refund policy.",
    link: { href: "/legal/refund", label: "refund policy" },
  },
] as const;

export type PricingShowcasePlan = {
  name: string;
  badge: string | null;
  description: string;
  monthlyPriceLkr: number | null;
  annualPriceLkr: number | null;
  annualSavingsPercent: number;
  features: string[];
  popular?: boolean;
  ctaHref: string;
  ctaLabel: string;
  featureHeading: string;
};
