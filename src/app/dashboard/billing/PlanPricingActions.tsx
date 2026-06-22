"use client";

import { useState } from "react";
import type { BillingInterval, PaidPlan } from "@/lib/plan";
import { dashboardFilterPillClass } from "@/lib/dashboard-ui";
import { UpgradeButton } from "./UpgradeButton";

export function PlanPricingActions({
  monthlyLkr,
  annualLkr,
  targetPlan,
  available,
  savings,
}: {
  monthlyLkr: number;
  annualLkr: number;
  targetPlan: PaidPlan;
  available: boolean;
  savings: number;
}) {
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  if (!available) {
    return null;
  }

  const price = interval === "annual" ? annualLkr : monthlyLkr;
  const priceLabel =
    interval === "annual"
      ? `Rs ${price.toLocaleString("en-LK")} / year`
      : `Rs ${price.toLocaleString("en-LK")} / month`;

  return (
    <div className="mt-5 space-y-4">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Billing interval">
        <button
          type="button"
          role="tab"
          aria-selected={interval === "monthly"}
          onClick={() => setInterval("monthly")}
          className={dashboardFilterPillClass(interval === "monthly")}
        >
          Monthly
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={interval === "annual"}
          onClick={() => setInterval("annual")}
          className={dashboardFilterPillClass(interval === "annual")}
        >
          Annual{savings > 0 ? ` · save ${savings}%` : ""}
        </button>
      </div>
      <UpgradeButton
        targetPlan={targetPlan}
        interval={interval}
        label={`Subscribe — ${priceLabel}`}
      />
    </div>
  );
}
