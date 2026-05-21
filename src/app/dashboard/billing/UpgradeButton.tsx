"use client";

import { useState } from "react";

export function UpgradeButton({
  targetPlan = "pro",
  label,
}: {
  targetPlan?: "pro" | "max";
  label?: string;
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
        body: JSON.stringify({ plan: targetPlan }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not start the upgrade.");
        setLoading(false);
        return;
      }

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

  const defaultLabel =
    targetPlan === "max" ? "Upgrade to Max" : "Upgrade to Pro";

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Redirecting to PayHere…" : (label ?? defaultLabel)}
      </button>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
