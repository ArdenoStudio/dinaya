"use client";

import { useState } from "react";
import { toast } from "@heroui/react";
import { DataTable, type DataTableColumn } from "@/components/dashboard/DataTable";
import { DashboardSwitch } from "@/components/dashboard/DashboardFormField";
import { dashboardCardClass } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

type Rule = {
  id: string;
  name: string;
  trigger: string;
  delayMinutes: number;
  isActive: boolean;
};

const templates = [
  {
    name: "Booking confirmation message",
    trigger: "booking.confirmed",
    delayMinutes: 0,
    actions: [{ type: "send_email", template: "booking_confirmation" }],
  },
  {
    name: "Post-visit review request",
    trigger: "booking.completed",
    delayMinutes: 120,
    actions: [{ type: "send_email", template: "review_request" }],
  },
  {
    name: "No-show follow-up",
    trigger: "booking.no_show",
    delayMinutes: 60,
    actions: [{ type: "send_email", template: "no_show_follow_up" }],
  },
];

export function AutomationsClient({ initialRules }: { initialRules: Rule[] }) {
  const [rules, setRules] = useState(initialRules);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function createTemplate(template: (typeof templates)[number]) {
    setSaving(template.name);
    setError("");
    const res = await fetch("/api/dashboard/automations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(template),
    });
    const data = await res.json();
    if (res.ok) {
      setRules((current) => [data, ...current]);
      toast.success("Automation added");
    } else {
      setError(data.error ?? "Could not create automation.");
    }
    setSaving(null);
  }

  async function toggleRule(rule: Rule) {
    const res = await fetch(`/api/dashboard/automations/${rule.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !rule.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRules((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } else {
      toast.danger("Could not update automation");
    }
  }

  const columns: DataTableColumn<Rule>[] = [
    {
      key: "name",
      header: "Rule",
      render: (rule) => (
        <div>
          <p className="font-medium">{rule.name}</p>
          <p className="text-xs text-muted-foreground">
            {rule.trigger}
            {rule.delayMinutes > 0 ? ` · after ${rule.delayMinutes} minutes` : ""}
          </p>
        </div>
      ),
    },
    {
      key: "status",
      header: "",
      align: "right",
      render: (rule) => (
        <DashboardSwitch label={rule.isActive ? "On" : "Off"} isSelected={rule.isActive} onChange={() => toggleRule(rule)} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Active rules are processed every 15 minutes by Dinaya automations cron.
      </p>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Templates</h2>
        <div className="grid gap-3 md:grid-cols-3">
          {templates.map((template) => (
            <button
              key={template.name}
              onClick={() => createTemplate(template)}
              disabled={saving === template.name}
              className={cn(dashboardCardClass, "p-4 text-left hover:border-primary/30 disabled:opacity-50")}
            >
              <p className="font-medium">{template.name}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Trigger: {template.trigger.replace("booking.", "")}
              </p>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Rules</h2>
        {rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">No rules yet. Start from a template.</p>
        ) : (
          <DataTable columns={columns} rows={rules} getRowId={(rule) => rule.id} />
        )}
      </div>
    </div>
  );
}
