"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewServicePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    description: "",
    durationMinutes: 30,
    priceLkr: 0,
    requiresPayment: false,
    depositPercent: 0,
    beforeBuffer: 0,
    afterBuffer: 0,
    minimumNoticeHours: 0,
    dailyCapacity: "" as string | number,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/dashboard/services", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error");
      if (res.status === 402) track("plan_limit_reached", { limit: "services", surface: "new_service" });
      setLoading(false);
      return;
    }
    router.push("/dashboard/services");
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-cal text-2xl mb-6">New service</h1>
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Service name *</label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g. Haircut" />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Duration (minutes) *</label>
            <input type="number" min={5} max={480} required value={form.durationMinutes}
              onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value) }))}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div>
            <label className="text-sm font-medium">Price (LKR)</label>
            <input type="number" min={0} value={form.priceLkr}
              onChange={(e) => setForm((f) => ({ ...f, priceLkr: parseInt(e.target.value) || 0 }))}
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Buffer time</label>
          <p className="text-xs text-muted-foreground mb-2">Block time before/after each appointment for prep or cleanup.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Before (minutes)</label>
              <select
                value={form.beforeBuffer}
                onChange={(e) => setForm((f) => ({ ...f, beforeBuffer: parseInt(e.target.value) }))}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>{m === 0 ? "No buffer" : `${m} min`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">After (minutes)</label>
              <select
                value={form.afterBuffer}
                onChange={(e) => setForm((f) => ({ ...f, afterBuffer: parseInt(e.target.value) }))}
                className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>{m === 0 ? "No buffer" : `${m} min`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Minimum notice</label>
          <p className="text-xs text-muted-foreground mb-2">How far in advance must clients book?</p>
          <select
            value={form.minimumNoticeHours}
            onChange={(e) => setForm((f) => ({ ...f, minimumNoticeHours: parseInt(e.target.value) }))}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {[0, 1, 2, 4, 6, 12, 24, 48, 72].map((h) => (
              <option key={h} value={h}>{h === 0 ? "No minimum" : h < 24 ? `${h} hour${h > 1 ? "s" : ""}` : `${h / 24} day${h / 24 > 1 ? "s" : ""}`}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium">Daily capacity</label>
          <p className="text-xs text-muted-foreground mb-2">Max bookings per staff per day for this service. Leave blank for unlimited.</p>
          <input
            type="number"
            min={1}
            max={100}
            value={form.dailyCapacity}
            onChange={(e) => setForm((f) => ({ ...f, dailyCapacity: e.target.value }))}
            placeholder="Unlimited"
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.requiresPayment}
            onChange={(e) => setForm((f) => ({ ...f, requiresPayment: e.target.checked }))}
            className="rounded" />
          <span className="text-sm">Require online payment at booking</span>
        </label>
        {form.requiresPayment && (
          <div>
            <label className="text-sm font-medium">Deposit percentage</label>
            <p className="text-xs text-muted-foreground mb-2">
              Use 0 for full payment, or collect a smaller deposit to reduce no-shows.
            </p>
            <input
              type="number"
              min={0}
              max={100}
              value={form.depositPercent}
              onChange={(e) => setForm((f) => ({ ...f, depositPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm">
            <p className="text-destructive">{error}</p>
            {/upgrade/i.test(error) ? (
              <Link
                href="/dashboard/billing"
                onClick={() => track("plan_upgrade_prompt_clicked", { limit: "services", surface: "new_service" })}
                className="mt-2 inline-flex rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700"
              >
                Compare Pro plans
              </Link>
            ) : null}
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button type="submit" disabled={loading}
            className="ml-auto bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {loading ? "Saving…" : "Save service"}
          </button>
        </div>
      </form>
    </div>
  );
}
