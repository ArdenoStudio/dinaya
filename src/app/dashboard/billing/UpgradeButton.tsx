"use client";

import { useState } from "react";
import type { BillingInterval, PaidPlan } from "@/lib/plan";
import { trackPlanUpgradeStart } from "@/lib/analytics/gtag";
import { DashboardConfirmDialog } from "@/components/dashboard/DashboardConfirmDialog";
import { Button } from "@/components/ui/button";
import { planDisplayName } from "@/lib/plan-display";

export function UpgradeButton({
  targetPlan = "pro",
  interval = "monthly",
  label,
  variant = "primary",
}: {
  targetPlan?: PaidPlan;
  interval?: BillingInterval;
  label?: string;
  variant?: "primary" | "secondary";
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function startCheckout() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan, interval }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start the upgrade.");
        setLoading(false);
        return;
      }

      trackPlanUpgradeStart({ plan: targetPlan, interval });

      const form = document.createElement("form");
      form.method = "POST";
      form.action = data.checkoutUrl as string;
      form.style.display = "none";
      for (const [key, value] of Object.entries(data.formData as Record<string, string>)) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = key;
        input.value = value;
        form.appendChild(input);
      }
      document.body.appendChild(form);
      form.submit();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const tier = planDisplayName(targetPlan);
  const defaultLabel =
    interval === "annual" ? `${tier} — annual` : `${tier} — monthly`;

  return (
    <div>
      <Button
        type="button"
        onClick={() => setConfirmOpen(true)}
        disabled={loading}
        variant={variant === "secondary" ? "outline" : "default"}
        className="min-h-11"
      >
        {loading ? "Redirecting to PayHere…" : (label ?? defaultLabel)}
      </Button>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}

      <DashboardConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Continue to PayHere for ${tier}?`}
        description={`You will leave Dinaya to complete payment for the ${tier} plan (${interval === "annual" ? "annual" : "monthly"} billing). Your card details are handled securely by PayHere.`}
        confirmLabel="Continue to PayHere"
        variant="default"
        onConfirm={startCheckout}
      />
    </div>
  );
}
