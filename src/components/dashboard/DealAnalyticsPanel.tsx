import { formatLkr } from "@/lib/utils";
import type { DealAnalyticsSummary } from "@/lib/deals/analytics";

export function DealAnalyticsPanel({ analytics }: { analytics: DealAnalyticsSummary }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-cal text-xl">Deals performance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Flash discounts posted on Dinaya Deals and their booking impact.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Deals posted this month" value={String(analytics.dealsPostedThisMonth)} />
        <MetricCard label="Total redemptions" value={String(analytics.totalRedemptions)} />
        <MetricCard label="Deal revenue" value={formatLkr(analytics.dealAttributedRevenueLkr)} />
        <MetricCard
          label="Conversion rate"
          value={analytics.conversionRatePercent !== null ? `${analytics.conversionRatePercent}%` : "—"}
        />
      </div>

      {analytics.bestDeal ? (
        <div className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5">
          <p className="text-sm font-medium">Best-performing deal</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {analytics.bestDeal.serviceName} · {analytics.bestDeal.discountPercent}% off ·{" "}
            {analytics.bestDeal.redemptions} redemption{analytics.bestDeal.redemptions === 1 ? "" : "s"}
          </p>
        </div>
      ) : null}

      {analytics.redemptionsByDiscount.length > 0 ? (
        <div className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5">
          <p className="text-sm font-medium mb-3">Redemptions by discount depth</p>
          <div className="space-y-2">
            {analytics.redemptionsByDiscount.map((row) => (
              <div key={row.discountPercent} className="flex items-center justify-between text-sm">
                <span>{row.discountPercent}% off</span>
                <span className="font-medium">{row.redemptions}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
