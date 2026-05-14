"use client";

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
    beforeBuffer: 0,
    afterBuffer: 0,
    minimumNoticeHours: 0,
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
    if (!res.ok) { setError(data.error ?? "Error"); setLoading(false); return; }
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
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.requiresPayment}
            onChange={(e) => setForm((f) => ({ ...f, requiresPayment: e.target.checked }))}
            className="rounded" />
          <span className="text-sm">Require online payment at booking</span>
        </label>
        {error && <p className="text-destructive text-sm">{error}</p>}
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
