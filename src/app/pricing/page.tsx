import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { CTAPrimaryButton } from "@/components/cta-primary-button";
import { LandingFooter } from "@/components/LandingFooter";
import { auth } from "@/auth";
import { annualSavingsPercent, getPlanConfigAsync } from "@/lib/plan";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "Pricing - 14-Day Free Trial | Dinaya",
  description:
    "Try Dinaya free for 14 days. Starter, Pro, Growth, and Managed Max pricing built for Sri Lankan small businesses.",
};

const starterFeatures = [
  "Public booking page",
  "yourname.dinaya.lk subdomain",
  "PayHere payments",
  "Unlimited bookings",
  "1 branch, 2 staff, 10 services",
  "Email confirmations",
  "Basic deposits, clients, and reports",
];

const proFeatures = [
  "Everything in Starter",
  "1 branch, 5 staff, unlimited services",
  "SMS/WhatsApp reminder credits",
  "Google Calendar sync",
  "Reviews and advanced reports",
  "Basic automations",
  "WhatsApp support",
];

const growthFeatures = [
  "Everything in Pro",
  "3 branches and 15 staff",
  "Custom domain",
  "Remove Dinaya branding",
  "Full automations",
  "AI review replies, reactivation, and content",
  "AI Voice Receptionist coming soon",
];

const managedFeatures = [
  "Everything in Growth",
  "Custom branches, staff, and setup",
  "Managed onboarding and migration",
  "Voice receptionist rollout waitlist",
  "Priority WhatsApp and setup help",
  "Done-for-you optimization",
];

const addOns = [
  ["Extra branch", "LKR 1,500/mo each"],
  ["Extra staff pack, 5 users", "LKR 1,000/mo"],
  ["SMS/WhatsApp top-up", "Usage-based"],
  ["Custom domain setup help", "LKR 5,000 one-time"],
  ["Data migration", "From LKR 10,000"],
  ["AI Voice Receptionist", "Coming soon"],
  ["Managed onboarding", "From LKR 15,000 one-time"],
] as const;

const comparisonRows = [
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

const faqs = [
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
];

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString("en-LK")}`;
}

function PlanCell({ value }: { value: string }) {
  return (
    <td className="px-4 py-3 text-center text-sm text-gray-700">
      {value === "Yes" ? (
        <Icon name="check" className="text-sm text-primary" />
      ) : value === "No" ? (
        <span className="text-gray-400">-</span>
      ) : (
        value
      )}
    </td>
  );
}

function FeatureList({ items, tone = "blue" }: { items: string[]; tone?: "blue" | "amber" | "emerald" | "slate" }) {
  const toneClass =
    tone === "amber"
      ? "bg-amber-400/20 text-amber-700"
      : tone === "emerald"
      ? "bg-emerald-500/15 text-emerald-700"
      : tone === "slate"
      ? "bg-slate-200 text-slate-700"
      : "bg-primary/15 text-primary";

  return (
    <ul className="space-y-3 text-sm">
      {items.map((feature) => (
        <li key={feature} className="flex items-start gap-2.5">
          <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${toneClass}`}>
            <Icon name="check" style={{ fontSize: "0.625rem" }} />
          </span>
          <span className="text-gray-700">{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export default async function PricingPage() {
  const session = await auth();
  const ctaHref = session?.user ? "/dashboard/billing" : "/register";
  const ctaLabel = session?.user ? "Manage in dashboard" : "Start free trial";
  const config = await getPlanConfigAsync();

  const starterAnnualSavings = annualSavingsPercent(
    config.starterMonthlyPriceLkr,
    config.starterAnnualPriceLkr,
  );
  const proAnnualSavings = annualSavingsPercent(config.proMonthlyPriceLkr, config.proAnnualPriceLkr);
  const growthAnnualSavings = annualSavingsPercent(config.maxMonthlyPriceLkr, config.maxAnnualPriceLkr);

  const plans = [
    {
      name: "Starter",
      badge: null,
      description: "For solo owners and very small salons, classes, and clinics.",
      monthly: formatLkr(config.starterMonthlyPriceLkr),
      annual: `${formatLkr(config.starterAnnualPriceLkr)}/yr`,
      savings: starterAnnualSavings,
      features: starterFeatures,
      tone: "emerald" as const,
      className: "border-emerald-200 bg-white",
    },
    {
      name: "Pro",
      badge: "Most Popular",
      description: "For businesses ready to reduce no-shows and manage clients properly.",
      monthly: formatLkr(config.proMonthlyPriceLkr),
      annual: `${formatLkr(config.proAnnualPriceLkr)}/yr`,
      savings: proAnnualSavings,
      features: proFeatures,
      tone: "blue" as const,
      className: "border-blue-300 bg-blue-50/60 shadow-lg shadow-blue-100",
    },
    {
      name: "Growth",
      badge: null,
      description: "For businesses that want repeat bookings, reviews, and AI follow-ups.",
      monthly: formatLkr(config.maxMonthlyPriceLkr),
      annual: `${formatLkr(config.maxAnnualPriceLkr)}/yr`,
      savings: growthAnnualSavings,
      features: growthFeatures,
      tone: "amber" as const,
      className: "border-amber-300 bg-amber-50/60",
    },
    {
      name: "Managed Max",
      badge: "Managed",
      description: "For teams that want Dinaya set up and optimized for them.",
      monthly: "From LKR 12,900",
      annual: "Custom annual",
      savings: 0,
      features: managedFeatures,
      tone: "slate" as const,
      className: "border-slate-300 bg-slate-50",
      href: "/contact",
      cta: "Contact Dinaya",
    },
  ];

  return (
    <main className="min-h-screen bg-white">
      <PublicNav />

      <section className="mx-auto max-w-4xl px-6 public-page-offset pb-10 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-xs font-medium text-gray-700 shadow-sm">
          <Icon name="stars" className="text-xs text-primary" />
          14-day free trial - no card required
        </div>
        <h1 className="font-cal text-5xl tracking-tight text-balance">
          Simple pricing for Sri Lankan small businesses.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Try Dinaya free for 14 days. Your booking page goes live instantly, then you choose the plan that fits your business.
        </p>
        <div className="mt-8">
          <CTAPrimaryButton href={ctaHref} size="md">
            {ctaLabel}
          </CTAPrimaryButton>
        </div>
      </section>

      <section className="px-6 pb-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-blue-200 bg-blue-50/70 p-5 text-sm text-blue-950">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">Trial includes Starter + Pro features with a limited Growth preview.</p>
              <p className="mt-1 text-blue-950/75">
                No custom domain and no unlimited messaging during trial. AI Voice Receptionist is coming later.
              </p>
            </div>
            <Link href="/register" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Try Dinaya free
              <Icon name="arrow-right" className="text-sm" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-4">
          {plans.map((plan) => (
            <section key={plan.name} className={`flex min-h-full flex-col rounded-2xl border p-6 ${plan.className}`}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-cal text-2xl tracking-tight">{plan.name}</h2>
                  <p className="mt-2 min-h-[3.75rem] text-sm leading-relaxed text-gray-600">
                    {plan.description}
                  </p>
                </div>
                {plan.badge && (
                  <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary ring-1 ring-primary/20">
                    {plan.badge}
                  </span>
                )}
              </div>

              <div className="mb-6">
                <div className="flex items-baseline gap-1">
                  <span className="font-cal text-4xl tracking-tight">{plan.monthly}</span>
                  {plan.name !== "Managed Max" && <span className="text-sm text-gray-500">/mo</span>}
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {plan.annual}
                  {plan.savings > 0 && <span className="ml-1 text-emerald-700">save {plan.savings}%</span>}
                </p>
              </div>

              <Link
                href={plan.href ?? ctaHref}
                className="mb-6 inline-flex items-center justify-center gap-2 rounded-lg bg-gray-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
              >
                {plan.cta ?? ctaLabel}
                <Icon name="arrow-right" className="text-sm" />
              </Link>

              <FeatureList items={plan.features} tone={plan.tone} />
            </section>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-8 text-center">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            Compare plans
          </span>
          <h2 className="mt-3 font-cal text-3xl tracking-tight">What each plan gets</h2>
        </div>

        <div className="overflow-hidden rounded-2xl border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="w-[28%] px-4 py-3 text-left font-medium text-gray-600">Feature</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Starter</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Pro</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Growth</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600">Managed Max</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {comparisonRows.map(([feature, starter, pro, growth, managed]) => (
                  <tr key={feature} className="hover:bg-gray-50/70">
                    <td className="px-4 py-3 font-medium text-gray-800">{feature}</td>
                    <PlanCell value={starter} />
                    <PlanCell value={pro} />
                    <PlanCell value={growth} />
                    <PlanCell value={managed} />
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-6 pb-20">
        <div className="mb-8 text-center">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            Add-ons
          </span>
          <h2 className="mt-3 font-cal text-3xl tracking-tight">Keep setup-heavy work outside base plans</h2>
        </div>

        <div className="overflow-hidden rounded-2xl border">
          <table className="w-full text-sm">
            <tbody className="divide-y">
              {addOns.map(([name, price]) => (
                <tr key={name}>
                  <td className="px-5 py-4 font-medium text-gray-800">{name}</td>
                  <td className="px-5 py-4 text-right text-gray-700">{price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20">
        <div className="mb-10 text-center">
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            FAQ
          </span>
          <h2 className="mt-3 font-cal text-3xl tracking-tight">Questions, answered</h2>
        </div>

        <div className="divide-y border-y">
          {faqs.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <span className="font-cal text-base tracking-tight text-gray-900">{item.q}</span>
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-gray-500 transition-colors group-open:border-primary group-open:bg-primary group-open:text-white">
                  <Icon name="plus" className="text-xs transition-transform group-open:rotate-45" />
                </span>
              </summary>
              <p className="mt-3 pr-10 text-sm leading-relaxed text-muted-foreground">
                {"link" in item && item.link ? (
                  <>
                    {item.a.split(item.link.label)[0]}
                    <Link href={item.link.href} className="text-primary underline underline-offset-2 hover:text-primary/80">
                      {item.link.label}
                    </Link>
                    {item.a.split(item.link.label)[1]}
                  </>
                ) : (
                  item.a
                )}
              </p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl rounded-3xl bg-gray-950 px-8 py-16 text-center text-white">
          <h2 className="font-cal text-3xl tracking-tight md:text-4xl">
            Try Dinaya free for 14 days.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">
            No card required. Your booking page goes live instantly.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 font-semibold text-gray-950 transition-colors hover:bg-white/95"
          >
            Start free trial
            <Icon name="arrow-right" className="text-sm" />
          </Link>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
