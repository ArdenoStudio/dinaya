"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSelect, DashboardTextAreaField, DashboardTextField } from "@/components/dashboard/DashboardFormField";
import { submitResource } from "@/lib/dashboard/use-resource";
import {
  dashboardErrorAlertClass,
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

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const result = await submitResource("/api/dashboard/clients", form, "POST");
    if (!result.ok) {
      setError(result.error);
      setSaving(false);
      return;
    }
    const client = result.data as { id: string };
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
        {error ? <p className={dashboardErrorAlertClass}>{error}</p> : null}

        <DashboardTextField label="Name" isRequired value={form.name} onChange={(v) => set("name", v)} />
        <DashboardTextField label="Phone" isRequired value={form.phone} onChange={(v) => set("phone", v)} />
        <DashboardTextField label="Email" type="email" value={form.email} onChange={(v) => set("email", v)} />

        <DashboardSelect
          label="Stage"
          value={form.stage}
          onChange={(v) => setForm((f) => ({ ...f, stage: v }))}
          options={STAGES.map((s) => ({ value: s, label: s.charAt(0).toUpperCase() + s.slice(1) }))}
        />

        <DashboardTextField
          label="Source"
          placeholder="e.g. referral, walk-in, Instagram…"
          value={form.source}
          onChange={(v) => set("source", v)}
        />

        <DashboardTextAreaField
          label="Internal notes"
          rows={3}
          value={form.internalNotes}
          onChange={(v) => set("internalNotes", v)}
        />

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
