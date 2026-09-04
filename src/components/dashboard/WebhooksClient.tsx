"use client";

import { useState, useEffect } from "react";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { DashboardLoadingPanel } from "@/components/dashboard/DashboardLoadingPanel";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  dashboardCardClass,
  dashboardInputClass,
  dashboardLabelClass,
  dashboardOutlineActionClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
  dashboardSectionMutedClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import { Webhook } from "lucide-react";

const ALL_EVENTS = [
  { value: "booking.created", label: "Booking created" },
  { value: "booking.confirmed", label: "Booking confirmed" },
  { value: "booking.rescheduled", label: "Booking rescheduled" },
  { value: "booking.cancelled", label: "Booking cancelled" },
  { value: "booking.completed", label: "Booking completed" },
  { value: "booking.no_show", label: "No-show marked" },
] as const;

type WebhookEvent = typeof ALL_EVENTS[number]["value"];

interface WebhookRow {
  id: string;
  url: string;
  hasSecret: boolean;
  secret?: string | null;
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: string;
}

export function WebhooksClient() {
  const [hooks, setHooks] = useState<WebhookRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ url: "", events: ["booking.created"] as WebhookEvent[] });
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard/webhooks")
      .then((r) => r.json())
      .then((d) => { setHooks(Array.isArray(d) ? d : []); setLoading(false); });
  }, []);

  function toggleEvent(event: WebhookEvent) {
    setForm((f) => ({
      ...f,
      events: f.events.includes(event)
        ? f.events.filter((e) => e !== event)
        : [...f.events, event],
    }));
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!form.url || !form.events.length) return;
    setAdding(true);
    const res = await fetch("/api/dashboard/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const hook = await res.json();
      setHooks((prev) => [hook, ...prev]);
      setRevealedSecret(hook.secret);
      setShowForm(false);
      setForm({ url: "", events: ["booking.created"] });
    }
    setAdding(false);
  }

  async function toggleActive(hook: WebhookRow) {
    const res = await fetch(`/api/dashboard/webhooks/${hook.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !hook.isActive }),
    });
    if (res.ok) {
      const updated = await res.json();
      setHooks((prev) => prev.map((h) => h.id === hook.id ? updated : h));
    }
  }

  async function handleDelete(id: string) {
    await fetch(`/api/dashboard/webhooks/${id}`, { method: "DELETE" });
    setHooks((prev) => prev.filter((h) => h.id !== id));
  }

  return (
    <div className={cn(dashboardPageClass, "max-w-2xl")}>
      <DashboardPageHeader
        title="Webhooks"
        description="Get notified at a URL when booking events happen. Verified with an HMAC-SHA256 signature."
        backHref="/dashboard/settings/integrations"
        backLabel="Integrations"
        actions={
          <button
            onClick={() => setShowForm((v) => !v)}
            className={dashboardPrimaryActionClass}
          >
            + Add webhook
          </button>
        }
      />

      {revealedSecret && (
        <div className={dashboardSectionMutedClass}>
          <p className="mb-1 text-sm font-medium">Save your signing secret — it won&apos;t be shown again.</p>
          <code className="break-all rounded bg-muted px-2 py-1 text-xs">{revealedSecret}</code>
          <button onClick={() => setRevealedSecret(null)} className="ml-3 text-xs text-primary hover:underline">Dismiss</button>
        </div>
      )}

      {showForm && (
        <DashboardSection title="Add webhook">
        <form onSubmit={handleAdd} className="space-y-4">
          <div>
            <label className={dashboardLabelClass}>Endpoint URL *</label>
            <input
              required
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://your-server.com/webhooks/dinaya"
              className={dashboardInputClass}
            />
          </div>
          <div>
            <label className={dashboardLabelClass}>Events to send</label>
            <div className="mt-2 space-y-2">
              {ALL_EVENTS.map((ev) => (
                <label key={ev.value} className="flex cursor-pointer items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.events.includes(ev.value)}
                    onChange={() => toggleEvent(ev.value)}
                    className="rounded"
                  />
                  <span className="text-sm">{ev.label}</span>
                  <code className="text-xs text-muted-foreground">{ev.value}</code>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className={dashboardOutlineActionClass}>Cancel</button>
            <button
              type="submit"
              disabled={adding || !form.events.length}
              className={cn(dashboardPrimaryActionClass, "ml-auto disabled:opacity-50")}
            >
              {adding ? "Adding…" : "Add webhook"}
            </button>
          </div>
        </form>
        </DashboardSection>
      )}

      {loading ? (
        <DashboardLoadingPanel rows={2} />
      ) : hooks.length === 0 ? (
        <EmptyState
          icon={Webhook}
          title="No webhooks yet"
          description="Add a webhook endpoint to receive booking events at your server."
          action={
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className={dashboardPrimaryActionClass}
            >
              Add webhook
            </button>
          }
        />
      ) : (
        <div className={cn(dashboardCardClass, "divide-y overflow-hidden")}>
          {hooks.map((hook) => (
            <div key={hook.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{hook.url}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {hook.events.map((ev) => (
                      <span key={ev} className="rounded-full bg-muted px-2 py-0.5 text-xs">{ev}</span>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleActive(hook)}
                    className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
                  >
                    {hook.isActive ? "Active" : "Paused"}
                  </button>
                  <ConfirmDialog
                    title="Delete webhook"
                    description="Delete this webhook? Your server will stop receiving events."
                    confirmLabel="Delete"
                    onConfirm={() => handleDelete(hook.id)}
                    trigger={
                      <button type="button" className="text-xs text-muted-foreground hover:text-destructive">
                        Delete
                      </button>
                    }
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
