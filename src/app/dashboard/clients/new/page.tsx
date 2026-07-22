"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  dashboardErrorAlertClass,
  dashboardInputClass,
  dashboardLabelClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
  dashboardSectionClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

const STAGES = ["lead", "prospect", "active", "churned"] as const;

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    stage: "lead" as (typeof STAGES)[number],
    source: "",
    internalNotes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/dashboard/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }
    const client = await res.json();
    router.push(`/dashboard/clients/${client.id}`);
  }

  return (
    <div className={cn(dashboardPageClass, "max-w-lg")}>
      <DashboardPageHeader
        backHref="/dashboard/clients"
        backLabel="Clients"
        title="New client"
      />

      <form onSubmit={handleSubmit} className={cn(dashboardSectionClass, "space-y-4")}>
        {error ? (
          <div
            className={cn(
              dashboardErrorAlertClass,
              "rounded-md border border-red-200 bg-red-50 px-4 py-2 dark:border-red-900/50 dark:bg-red-950/30",
            )}
          >
            {error}
          </div>
        ) : null}

        <div>
          <label className={dashboardLabelClass}>Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className={dashboardInputClass}
          />
        </div>

        <div>
          <label className={dashboardLabelClass}>Phone *</label>
          <input
            required
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className={dashboardInputClass}
          />
        </div>

        <div>
          <label className={dashboardLabelClass}>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={dashboardInputClass}
          />
        </div>

        <div>
          <label className={dashboardLabelClass}>Stage</label>
          <select
            value={form.stage}
            onChange={(e) => set("stage", e.target.value)}
            className={dashboardInputClass}
          >
            {STAGES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={dashboardLabelClass}>Source</label>
          <input
            placeholder="e.g. referral, walk-in, Instagram…"
            value={form.source}
            onChange={(e) => set("source", e.target.value)}
            className={dashboardInputClass}
          />
        </div>

        <div>
          <label className={dashboardLabelClass}>Internal notes</label>
          <textarea
            rows={3}
            value={form.internalNotes}
            onChange={(e) => set("internalNotes", e.target.value)}
            className={cn(dashboardInputClass, "resize-none")}
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className={cn(dashboardPrimaryActionClass, "w-full justify-center")}
        >
          {saving ? "Saving…" : "Save client"}
        </button>
      </form>
    </div>
  );
}
