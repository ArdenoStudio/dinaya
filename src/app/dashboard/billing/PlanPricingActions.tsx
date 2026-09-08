"use client";

import { useState } from "react";
import { DashboardFilterPill } from "@/components/dashboard/DashboardFilterBar";
import type { BillingInterval, PaidPlan } from "@/lib/plan";
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
      <div className="flex flex-wrap gap-2" role="group" aria-label="Billing interval">
        <DashboardFilterPill isSelected={interval === "monthly"} onChange={() => setInterval("monthly")}>
          Monthly
        </DashboardFilterPill>
        <DashboardFilterPill isSelected={interval === "annual"} onChange={() => setInterval("annual")}>
          Annual{savings > 0 ? ` · save ${savings}%` : ""}
        </DashboardFilterPill>
      </div>
      <UpgradeButton
        targetPlan={targetPlan}
        interval={interval}
        label={`Subscribe — ${priceLabel}`}
      />
    </div>
  );
}
