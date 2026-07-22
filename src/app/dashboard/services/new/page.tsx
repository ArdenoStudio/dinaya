"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { IntakeQuestionsEditor } from "@/components/dashboard/IntakeQuestionsEditor";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import type { IntakeQuestion } from "@/lib/intake";
import {
  dashboardErrorAlertClass,
  dashboardInputClass,
  dashboardLabelClass,
  dashboardOutlineActionClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
  dashboardSectionClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

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
    maximumAdvanceDays: 0,
    intakeQuestions: [] as IntakeQuestion[],
    successRedirectUrl: "",
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
      body: JSON.stringify({
        ...form,
        dailyCapacity: form.dailyCapacity === "" ? null : Number(form.dailyCapacity),
        maximumAdvanceDays: form.maximumAdvanceDays || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error"); setLoading(false); return; }
    router.push("/dashboard/services");
  }

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="New service"
        backHref="/dashboard/services"
        backLabel="Services"
      />

      <form onSubmit={handleSubmit} className={cn(dashboardSectionClass, "max-w-lg space-y-4")}>
        <div>
          <label className={dashboardLabelClass}>Service name *</label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={dashboardInputClass}
            placeholder="e.g. Haircut" />
        </div>
        <div>
          <label className={dashboardLabelClass}>Description</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className={cn(dashboardInputClass, "resize-none")} rows={2} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={dashboardLabelClass}>Duration (minutes) *</label>
            <input type="number" min={5} max={480} required value={form.durationMinutes}
              onChange={(e) => setForm((f) => ({ ...f, durationMinutes: parseInt(e.target.value) }))}
              className={dashboardInputClass} />
          </div>
          <div>
            <label className={dashboardLabelClass}>Price (LKR)</label>
            <input type="number" min={0} value={form.priceLkr}
              onChange={(e) => setForm((f) => ({ ...f, priceLkr: parseInt(e.target.value) || 0 }))}
              className={dashboardInputClass} />
          </div>
        </div>
        <div>
          <label className={dashboardLabelClass}>Buffer time</label>
          <p className="text-xs text-muted-foreground mb-2">Block time before/after each appointment for prep or cleanup.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Before (minutes)</label>
              <select
                value={form.beforeBuffer}
                onChange={(e) => setForm((f) => ({ ...f, beforeBuffer: parseInt(e.target.value) }))}
                className={dashboardInputClass}
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
                className={dashboardInputClass}
              >
                {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>{m === 0 ? "No buffer" : `${m} min`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <div>
          <label className={dashboardLabelClass}>Minimum notice</label>
          <p className="text-xs text-muted-foreground mb-2">How far in advance must clients book?</p>
          <select
            value={form.minimumNoticeHours}
            onChange={(e) => setForm((f) => ({ ...f, minimumNoticeHours: parseInt(e.target.value) }))}
            className={dashboardInputClass}
          >
            {[0, 1, 2, 4, 6, 12, 24, 48, 72].map((h) => (
              <option key={h} value={h}>{h === 0 ? "No minimum" : h < 24 ? `${h} hour${h > 1 ? "s" : ""}` : `${h / 24} day${h / 24 > 1 ? "s" : ""}`}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={dashboardLabelClass}>Daily capacity</label>
          <p className="text-xs text-muted-foreground mb-2">Max bookings per staff per day for this service. Leave blank for unlimited.</p>
          <input
            type="number"
            min={1}
            max={100}
            value={form.dailyCapacity}
            onChange={(e) => setForm((f) => ({ ...f, dailyCapacity: e.target.value }))}
            placeholder="Unlimited"
            className={dashboardInputClass}
          />
        </div>
        <div>
          <label className={dashboardLabelClass}>Booking window</label>
          <p className="text-xs text-muted-foreground mb-2">How far ahead can clients book this service?</p>
          <select
            value={form.maximumAdvanceDays}
            onChange={(e) => setForm((f) => ({ ...f, maximumAdvanceDays: parseInt(e.target.value) }))}
            className={dashboardInputClass}
          >
            {([[0, "No limit"], [7, "1 week"], [14, "2 weeks"], [30, "1 month"], [60, "2 months"], [90, "3 months"], [180, "6 months"], [365, "1 year"]] as [number, string][]).map(([d, labelText]) => (
              <option key={d} value={d}>{labelText}</option>
            ))}
          </select>
        </div>
        <IntakeQuestionsEditor
          value={form.intakeQuestions}
          onChange={(intakeQuestions) => setForm((f) => ({ ...f, intakeQuestions }))}
        />
        <div>
          <label className={dashboardLabelClass}>Success redirect URL</label>
          <p className="text-xs text-muted-foreground mb-2">
            Optional. Send clients here after booking (https:// URL or path like /thank-you).
          </p>
          <input
            value={form.successRedirectUrl}
            onChange={(e) => setForm((f) => ({ ...f, successRedirectUrl: e.target.value }))}
            placeholder="https://example.com/thank-you or /thank-you"
            className={dashboardInputClass}
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
            <label className={dashboardLabelClass}>Deposit percentage</label>
            <p className="text-xs text-muted-foreground mb-2">
              Use 0 for full payment, or collect a smaller deposit to reduce no-shows.
            </p>
            <input
              type="number"
              min={0}
              max={100}
              value={form.depositPercent}
              onChange={(e) => setForm((f) => ({ ...f, depositPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
              className={dashboardInputClass}
            />
          </div>
        )}
        {error && <p className={dashboardErrorAlertClass}>{error}</p>}
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className={dashboardOutlineActionClass}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={cn(dashboardPrimaryActionClass, "ml-auto")}>
            {loading ? "Saving…" : "Save service"}
          </button>
        </div>
      </form>
    </div>
  );
}
