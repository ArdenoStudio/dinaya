import Link from "next/link";
import { CTAPrimaryButton } from "@/components/cta-primary-button";
import { MARKETING_CTA_PRIMARY } from "@/lib/marketing-copy";
import { getPlanConfigAsync } from "@/lib/plan";

function formatLkr(amount: number) {
  return `LKR ${amount.toLocaleString("en-LK")}`;
}

export async function LandingPricingTeaser() {
  const config = await getPlanConfigAsync();

  return (
    <section className="border-t">
      <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-[1.1fr_1fr] md:items-center">
        <div>
          <span className="relative text-sm font-semibold tracking-tight text-primary">
            <span className="absolute top-0.5 -left-3 h-4 w-[3px] rounded-r-sm bg-primary" />
            Simple LKR pricing
          </span>
          <h2 className="font-cal mt-3 text-3xl tracking-tight text-balance md:text-4xl">
            Start free. Upgrade when bookings stick.
          </h2>
          <p className="mt-3 max-w-md text-muted-foreground text-pretty">
            Trial includes Starter and Pro features for 14 days. No commission on
            bookings — you keep what clients pay.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <CTAPrimaryButton href="/register" size="md">
              {MARKETING_CTA_PRIMARY}
            </CTAPrimaryButton>
            <Link
              href="/pricing"
              className="text-sm font-medium text-primary transition-colors hover:text-primary/80"
            >
              Compare plans →
            </Link>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              name: "Starter",
              price: formatLkr(config.starterMonthlyPriceLkr),
              note: "Get bookings online",
            },
            {
              name: "Pro",
              price: formatLkr(config.proMonthlyPriceLkr),
              note: "Reminders, ops, growth — main plan",
              highlight: true,
            },
          ].map((plan) => (
            <div
              key={plan.name}
              className={`rounded-2xl border px-5 py-5 ${
                plan.highlight
                  ? "border-primary/30 bg-primary/[0.04] dark:bg-primary/10"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <p className="font-cal text-lg tracking-tight">{plan.name}</p>
                {plan.highlight ? (
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-primary">
                    Popular
                  </span>
                ) : null}
              </div>
              <p className="mt-3 font-cal text-2xl tracking-tight tabular-nums">
                {plan.price}
                <span className="ml-1 text-sm font-sans font-normal text-muted-foreground">
                  /mo
                </span>
              </p>
              <p className="mt-2 text-sm text-muted-foreground">{plan.note}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
