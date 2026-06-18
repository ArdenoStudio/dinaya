"use client";

import { useState } from "react";
import type { BillingInterval, PaidPlan } from "@/lib/plan";
import { trackPlanUpgradeStart } from "@/lib/analytics/gtag";

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

  async function handleClick() {
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

  const tier =
    targetPlan === "max" ? "Growth" : targetPlan === "pro" ? "Pro" : "Starter";
  const defaultLabel =
    interval === "annual" ? `${tier} — annual` : `${tier} — monthly`;

  const className =
    variant === "secondary"
      ? "rounded-lg border border-neutral-300 bg-white px-5 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-neutral-50 disabled:opacity-50"
      : "rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50";

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className={className}
      >
        {loading ? "Redirecting to PayHere…" : (label ?? defaultLabel)}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
