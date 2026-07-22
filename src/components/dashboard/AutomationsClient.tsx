"use client";

import { useState } from "react";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import {
  dashboardCardClass,
  dashboardOutlineActionClass,
} from "@/lib/dashboard-ui";
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
      setRules((current) => current.map((item) => item.id === updated.id ? updated : item));
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Active rules are processed every 15 minutes by Dinaya automations cron.
      </p>
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

      {error && <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

      <DashboardSection title="Rules" className="overflow-hidden p-0">
        {rules.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No rules yet. Start from a template.</p>
        ) : (
          <div className="divide-y">
            {rules.map((rule) => (
              <div key={rule.id} className="flex items-center justify-between gap-4 px-5 py-4">
                <div>
                  <p className="font-medium">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {rule.trigger} {rule.delayMinutes > 0 ? `after ${rule.delayMinutes} minutes` : ""}
                  </p>
                </div>
                <button
                  onClick={() => toggleRule(rule)}
                  className={cn(
                    dashboardOutlineActionClass,
                    "text-xs",
                    rule.isActive && "border-primary/30 bg-primary/5 text-primary",
                  )}
                >
                  {rule.isActive ? "On" : "Off"}
                </button>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
