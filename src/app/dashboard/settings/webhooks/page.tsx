"use client";

import { useState, useEffect } from "react";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { EmptyState } from "@/components/dashboard/EmptyState";
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

interface Webhook {
  id: string;
  url: string;
  hasSecret: boolean;
  secret?: string | null;
  events: WebhookEvent[];
  isActive: boolean;
  createdAt: string;
}

export default function WebhooksPage() {
  const [hooks, setHooks] = useState<Webhook[]>([]);
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

  async function toggleActive(hook: Webhook) {
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
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-cal text-2xl">Webhooks</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Get notified at a URL when booking events happen. Verified with an HMAC-SHA256 signature.
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90"
        >
          + Add webhook
        </button>
      </div>

      {/* Newly created secret banner */}
      {revealedSecret && (
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <p className="text-sm font-medium text-yellow-800 mb-1">Save your signing secret — it won&apos;t be shown again.</p>
          <code className="text-xs bg-yellow-100 px-2 py-1 rounded break-all">{revealedSecret}</code>
          <button onClick={() => setRevealedSecret(null)} className="ml-3 text-xs text-yellow-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleAdd} className="mb-6 bg-white border rounded-xl p-5 space-y-4">
          <div>
            <label className="text-sm font-medium">Endpoint URL *</label>
            <input
              required
              type="url"
              value={form.url}
              onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
              placeholder="https://your-server.com/webhooks/dinaya"
              className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Events to send</label>
            <div className="mt-2 space-y-2">
              {ALL_EVENTS.map((ev) => (
                <label key={ev.value} className="flex items-center gap-2 cursor-pointer">
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
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" disabled={adding || !form.events.length}
              className="ml-auto bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {adding ? "Adding…" : "Add webhook"}
            </button>
          </div>
        </form>
      )}

      {/* Webhook list */}
      {loading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : hooks.length === 0 ? (
        <EmptyState
          icon={Webhook}
          title="No webhooks yet"
          description="Add a webhook endpoint to receive booking events at your server."
          action={
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Add webhook
            </button>
          }
        />
      ) : (
        <div className="bg-white border rounded-xl divide-y">
          {hooks.map((hook) => (
            <div key={hook.id} className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{hook.url}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {hook.events.map((ev) => (
                      <span key={ev} className="text-xs bg-muted px-2 py-0.5 rounded-full">{ev}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={() => toggleActive(hook)}
                    className={`text-xs px-2 py-0.5 rounded-full border ${hook.isActive ? "border-green-300 text-green-700 bg-green-50" : "border-gray-200 text-gray-500"}`}
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
