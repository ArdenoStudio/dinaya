import type { Metadata } from "next";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { CTAPrimaryButton } from "@/components/cta-primary-button";
import { LandingFooter } from "@/components/LandingFooter";
import { PricingPlansShowcase } from "@/components/pricing/PricingPlansShowcase";
import { Icon } from "@/components/ui/Icon";
import { auth } from "@/auth";
import { getBusinessContext } from "@/lib/auth";
import { MARKETING_CTA_PRIMARY } from "@/lib/marketing-copy";
import {
  addOnGroups,
  comparisonRows,
  faqs,
  growthFeatures,
  managedFeatures,
  proFeatures,
  starterFeatures,
  type PricingShowcasePlan,
} from "@/lib/pricing-page-content";
import { annualSavingsPercent, getPlanConfigAsync, resolveEffectivePlan } from "@/lib/plan";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing - 14-Day Free Trial | Dinaya",
  description:
    "Try Dinaya free for 14 days. Starter, Pro, Growth, and Managed Max pricing built for Sri Lankan small businesses.",
};

function PlanCell({ value, highlight }: { value: string; highlight?: boolean }) {
  return (
    <td
      className={cn(
        "px-4 py-3.5 text-center text-sm text-foreground/80",
        highlight && "bg-primary/4",
      )}
    >
      {value === "Yes" ? (
        <Icon name="check" className="mx-auto text-sm text-primary" />
      ) : value === "No" ? (
        <span className="text-muted-foreground/50">—</span>
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

  const businessContext = await getBusinessContext();
  const effectivePlan = businessContext
    ? resolveEffectivePlan({
        storedPlan: businessContext.business.plan,
        planExpiresAt: businessContext.business.planExpiresAt,
      })
    : null;
  const currentPlanKey =
    effectivePlan === "starter" || effectivePlan === "pro" || effectivePlan === "max"
      ? effectivePlan
      : null;

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
      planKey: "starter",
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
      planKey: "pro",
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
      trialNote: "Limited preview during your 14-day trial",
      planKey: "max",
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
        currentPlanKey={currentPlanKey}
      />

      <section className="px-6 pb-16 pt-4">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 rounded-2xl border border-primary/15 bg-primary/4 px-6 py-5 dark:bg-primary/10 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-cal text-lg tracking-tight text-foreground">
              Trial includes Starter + Pro features
            </p>
            <p className="mt-1 text-sm text-muted-foreground text-pretty">
              Limited Growth preview. No custom domain or unlimited messaging during trial. AI Voice
              Receptionist is coming later.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex shrink-0 items-center gap-2 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Start free trial
            <Icon name="arrow-right" className="text-sm" />
          </Link>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-10 max-w-2xl">
            <span className="relative text-sm font-semibold tracking-tight text-primary">
              <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
              Compare plans
            </span>
            <h2 className="font-cal mt-3 text-3xl tracking-tight md:text-4xl">
              What each plan gets
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              Same booking page foundation — more reminders, automations, and growth tools as you scale.
            </p>
          </div>

          <p className="mb-2 text-xs font-medium text-muted-foreground sm:hidden">
            Swipe to compare plans →
          </p>

          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40">
                    <th className="sticky left-0 z-10 w-[28%] bg-muted/40 px-4 py-3.5 text-left font-medium text-muted-foreground">
                      Feature
                    </th>
                    <th className="px-4 py-3.5 text-center font-medium text-muted-foreground">Starter</th>
                    <th className="px-4 py-3.5 text-center font-medium text-primary">Pro</th>
                    <th className="px-4 py-3.5 text-center font-medium text-muted-foreground">Growth</th>
                    <th className="px-4 py-3.5 text-center font-medium text-muted-foreground">
                      Managed Max
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {comparisonRows.map(([feature, starter, pro, growth, managed]) => (
                    <tr key={feature} className="group transition-colors hover:bg-muted/30">
                      <td className="sticky left-0 z-10 bg-card px-4 py-3.5 font-medium text-foreground group-hover:bg-muted/30">
                        {feature}
                      </td>
                      <PlanCell value={starter} />
                      <PlanCell value={pro} highlight />
                      <PlanCell value={growth} />
                      <PlanCell value={managed} />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="mb-10 max-w-2xl">
            <span className="relative text-sm font-semibold tracking-tight text-primary">
              <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
              Add-ons
            </span>
            <h2 className="font-cal mt-3 text-3xl tracking-tight md:text-4xl">
              Extra help when you need it
            </h2>
            <p className="mt-3 text-muted-foreground text-pretty">
              Keep setup-heavy work optional — not baked into every plan.
            </p>
          </div>

          <div className="space-y-6">
            {addOnGroups.map((group) => (
              <div key={group.label}>
                <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.label}
                </p>
                <ul className="divide-y divide-border rounded-2xl border border-border bg-card shadow-xs">
                  {group.items.map(([name, price]) => (
                    <li
                      key={name}
                      className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 sm:px-6"
                    >
                      <span className="font-medium text-foreground">{name}</span>
                      <span className="text-sm tabular-nums text-muted-foreground">{price}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border">
        <div className="mx-auto max-w-3xl px-6 py-20">
          <div className="mb-10 text-center">
            <span className="relative text-sm font-semibold tracking-tight text-primary">
              <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
              FAQ
            </span>
            <h2 className="font-cal mt-3 text-3xl tracking-tight md:text-4xl">Questions, answered</h2>
          </div>

          <div className="divide-y divide-border border-y border-border">
            {faqs.map((item) => (
              <details key={item.q} className="group py-5">
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4">
                  <span className="text-base font-semibold text-foreground">{item.q}</span>
                  <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-[background-color,border-color,color,transform] duration-150 group-open:border-primary group-open:bg-primary group-open:text-primary-foreground">
                    <Icon
                      name="plus"
                      className="text-xs transition-transform duration-150 group-open:rotate-45"
                    />
                  </span>
                </summary>
                <p className="mt-3 pr-10 text-sm leading-relaxed text-muted-foreground text-pretty">
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
        </div>
      </section>

      <section className="relative overflow-hidden px-6 pb-20">
        <div className="relative mx-auto max-w-4xl overflow-hidden rounded-4xl px-8 py-16 text-center">
          <div
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(80%_70%_at_50%_0%,hsl(220_82%_53%/0.16),transparent_65%)]"
            aria-hidden
          />
          <div className="pointer-events-none absolute inset-0 -z-10 rounded-4xl border border-border bg-muted/30" aria-hidden />
          <h2 className="font-cal text-3xl tracking-tight text-balance md:text-4xl">
            Try Dinaya free for 14 days.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground text-pretty">
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
