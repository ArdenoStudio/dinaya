import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { CTAPrimaryButton } from "@/components/cta-primary-button";
import { LandingFooter } from "@/components/LandingFooter";
import { PricingPlansShowcase } from "@/components/pricing/PricingPlansShowcase";
import { Icon } from "@/components/ui/Icon";
import { auth } from "@/auth";
import { MARKETING_CTA_PRIMARY } from "@/lib/marketing-copy";
import {
  addOns,
  comparisonRows,
  faqs,
  growthFeatures,
  managedFeatures,
  proFeatures,
  starterFeatures,
  type PricingShowcasePlan,
} from "@/lib/pricing-page-content";
import { annualSavingsPercent, getPlanConfigAsync } from "@/lib/plan";

export const metadata: Metadata = {
  title: "Pricing - 14-Day Free Trial | Dinaya",
  description:
    "Try Dinaya free for 14 days. Starter, Pro, Growth, and Managed Max pricing built for Sri Lankan small businesses.",
};

function PlanCell({ value }: { value: string }) {
  return (
    <td className="px-4 py-3 text-center text-sm text-gray-700 dark:text-gray-300">
      {value === "Yes" ? (
        <Icon name="check" className="text-sm text-primary" />
      ) : value === "No" ? (
        <span className="text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">-</span>
      ) : (
        value
      )}
    </td>
  );
}

export default async function PricingPage() {
  const session = await auth();
  const ctaHref = session?.user ? "/dashboard/billing" : "/register";
  const ctaLabel = session?.user ? "Manage in dashboard" : MARKETING_CTA_PRIMARY;
  const config = await getPlanConfigAsync();

  const plans: PricingShowcasePlan[] = [
    {
      name: "Starter",
      badge: null,
      description: "For solo owners and very small salons, classes, and clinics.",
      monthlyPriceLkr: config.starterMonthlyPriceLkr,
      annualPriceLkr: config.starterAnnualPriceLkr,
      annualSavingsPercent: annualSavingsPercent(
        config.starterMonthlyPriceLkr,
        config.starterAnnualPriceLkr,
      ),
      features: starterFeatures,
      ctaHref,
      ctaLabel,
      featureHeading: "Includes:",
    },
    {
      name: "Pro",
      badge: "Most popular",
      description: "For businesses ready to reduce no-shows and manage clients properly.",
      monthlyPriceLkr: config.proMonthlyPriceLkr,
      annualPriceLkr: config.proAnnualPriceLkr,
      annualSavingsPercent: annualSavingsPercent(config.proMonthlyPriceLkr, config.proAnnualPriceLkr),
      features: proFeatures,
      popular: true,
      ctaHref,
      ctaLabel,
      featureHeading: "Everything in Starter, plus:",
    },
    {
      name: "Growth",
      badge: null,
      description: "For businesses that want repeat bookings, reviews, and AI follow-ups.",
      monthlyPriceLkr: config.maxMonthlyPriceLkr,
      annualPriceLkr: config.maxAnnualPriceLkr,
      annualSavingsPercent: annualSavingsPercent(config.maxMonthlyPriceLkr, config.maxAnnualPriceLkr),
      features: growthFeatures,
      ctaHref,
      ctaLabel,
      featureHeading: "Everything in Pro, plus:",
    },
    {
      name: "Managed Max",
      badge: "Managed",
      description: "For teams that want Dinaya set up and optimized for them.",
      monthlyPriceLkr: null,
      annualPriceLkr: null,
      annualSavingsPercent: 0,
      features: managedFeatures,
      ctaHref: "/contact",
      ctaLabel: "Contact Dinaya",
      featureHeading: "Everything in Growth, plus:",
    },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-neutral-950">
      <PublicNav />

      <PricingPlansShowcase
        plans={plans}
        defaultCtaHref={ctaHref}
        defaultCtaLabel={ctaLabel}
      />

      <section className="px-6 py-14">
        <div className="mx-auto max-w-6xl rounded-2xl border border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-950/40 p-5 text-sm text-blue-950 dark:text-blue-100">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="font-semibold">Trial includes Starter + Pro features with a limited Growth preview.</p>
              <p className="mt-1 text-blue-950 dark:text-blue-100/75 dark:text-blue-200/75">
                No custom domain and no unlimited messaging during trial. AI Voice Receptionist is coming later.
              </p>
            </div>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Try Dinaya free
              <Icon name="arrow-right" className="text-sm" />
            </Link>
          </div>
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

        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-neutral-800">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-gray-50 dark:bg-neutral-900/60">
                <tr>
                  <th className="w-[28%] px-4 py-3 text-left font-medium text-gray-600 dark:text-gray-400">Feature</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Starter</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Pro</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Growth</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-600 dark:text-gray-400">Managed Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
                {comparisonRows.map(([feature, starter, pro, growth, managed]) => (
                  <tr key={feature} className="hover:bg-gray-50 dark:hover:bg-neutral-900/60">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{feature}</td>
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

        <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-neutral-800">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-200 dark:divide-neutral-800">
              {addOns.map(([name, price]) => (
                <tr key={name}>
                  <td className="px-5 py-4 font-medium text-gray-800 dark:text-gray-200">{name}</td>
                  <td className="px-5 py-4 text-right text-gray-700 dark:text-gray-300">{price}</td>
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

        <div className="divide-y divide-gray-200 dark:divide-neutral-800 border-y border-gray-200 dark:border-neutral-800">
          {faqs.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                <span className="font-cal text-base tracking-tight text-gray-900 dark:text-gray-100">{item.q}</span>
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-gray-500 dark:text-gray-400 transition-colors group-open:border-primary group-open:bg-primary group-open:text-white">
                  <Icon name="plus" className="text-xs transition-transform group-open:rotate-45" />
                </span>
              </summary>
              <p className="mt-3 pr-10 text-sm leading-relaxed text-muted-foreground">
                {"link" in item && item.link ? (
                  <>
                    {item.a.split(item.link.label)[0]}
                    <Link
                      href={item.link.href}
                      className="text-primary underline underline-offset-2 hover:text-primary/80"
                    >
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
          <h2 className="font-cal text-3xl tracking-tight md:text-4xl">Try Dinaya free for 14 days.</h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">
            No card required. Your booking page goes live instantly.
          </p>
          <CTAPrimaryButton href="/register" size="md" className="mt-8">
            {MARKETING_CTA_PRIMARY}
          </CTAPrimaryButton>
        </div>
      </section>

      <LandingFooter />
    </main>
  );
}
