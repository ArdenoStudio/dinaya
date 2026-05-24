"use client";

import { useEffect, useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";

type BroadcastRow = {
  id: string;
  name: string;
  channel: string;
  subject: string | null;
  body: string;
  audienceType: string;
  audienceFilter: unknown;
  status: string;
  recipientCount: number;
  sentCount: number;
  skippedCount: number;
  failedCount: number;
  sentAt: string | null;
  createdAt: string;
};

type FormState = {
  name: string;
  channel: "email" | "whatsapp" | "sms";
  subject: string;
  body: string;
  audienceType: "all" | "stage" | "tags";
  stage: "lead" | "prospect" | "active" | "churned";
  tags: string;
};

const DEFAULT_FORM: FormState = {
  name: "",
  channel: "email",
  subject: "",
  body: "",
  audienceType: "all",
  stage: "active",
  tags: "",
};

function audienceLabel(row: BroadcastRow): string {
  if (row.audienceType === "all") return "All clients";
  if (row.audienceType === "stage" && row.audienceFilter && typeof row.audienceFilter === "object" && "stage" in row.audienceFilter) {
    return `Stage: ${String((row.audienceFilter as { stage: string }).stage)}`;
  }
  if (row.audienceType === "tags" && row.audienceFilter && typeof row.audienceFilter === "object" && "tags" in row.audienceFilter) {
    const tags = (row.audienceFilter as { tags: string[] }).tags;
    return `Tags: ${tags.join(", ")}`;
  }
  return row.audienceType;
}

export function BroadcastsClient() {
  const [rows, setRows] = useState<BroadcastRow[]>([]);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/dashboard/broadcasts");
    const data = await res.json();
    setRows(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    setMessage("");

    const audienceFilter =
      form.audienceType === "stage"
        ? { stage: form.stage }
        : form.audienceType === "tags"
          ? { tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean) }
          : null;

    const res = await fetch("/api/dashboard/broadcasts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        channel: form.channel,
        subject: form.subject || null,
        body: form.body,
        audienceType: form.audienceType,
        audienceFilter,
        sendNow: true,
      }),
    });

    const data = await res.json();
    setSending(false);

    if (!res.ok) {
      setError(data.error ?? "Could not send broadcast.");
      return;
    }

    setForm(DEFAULT_FORM);
    setMessage(`Broadcast sent to ${data.broadcast.sentCount} of ${data.broadcast.recipientCount} clients.`);
    await load();
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Broadcasts"
        description="Send a one-time message to client segments by email, WhatsApp, or SMS. Clients who opted out are excluded."
      />

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-5">
        <h2 className="font-semibold">New broadcast</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Campaign name</span>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
              className="mt-1 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="March promo"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium">Channel</span>
            <select
              value={form.channel}
              onChange={(e) => setForm((current) => ({ ...current, channel: e.target.value as FormState["channel"] }))}
              className="mt-1 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="email">Email</option>
              <option value="whatsapp">WhatsApp</option>
              <option value="sms">SMS</option>
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Audience</span>
            <select
              value={form.audienceType}
              onChange={(e) => setForm((current) => ({ ...current, audienceType: e.target.value as FormState["audienceType"] }))}
              className="mt-1 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">All clients</option>
              <option value="stage">By CRM stage</option>
              <option value="tags">By tag</option>
            </select>
          </label>

          {form.audienceType === "stage" ? (
            <label className="block">
              <span className="text-sm font-medium">Stage</span>
              <select
                value={form.stage}
                onChange={(e) => setForm((current) => ({ ...current, stage: e.target.value as FormState["stage"] }))}
                className="mt-1 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="lead">Lead</option>
                <option value="prospect">Prospect</option>
                <option value="active">Active</option>
                <option value="churned">Churned</option>
              </select>
            </label>
          ) : null}

          {form.audienceType === "tags" ? (
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium">Tags (comma-separated)</span>
              <input
                required
                value={form.tags}
                onChange={(e) => setForm((current) => ({ ...current, tags: e.target.value }))}
                className="mt-1 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="vip, salon-regular"
              />
            </label>
          ) : null}

          {form.channel === "email" ? (
            <label className="block sm:col-span-2">
              <span className="text-sm font-medium">Email subject</span>
              <input
                value={form.subject}
                onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))}
                className="mt-1 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Special offer this week"
              />
            </label>
          ) : null}

          <label className="block sm:col-span-2">
            <span className="text-sm font-medium">Message</span>
            <textarea
              required
              value={form.body}
              onChange={(e) => setForm((current) => ({ ...current, body: e.target.value }))}
              className="mt-1 min-h-28 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
              placeholder="Hi {{name}}, we have a special offer for you this week…"
            />
          </label>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={sending}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Send className="size-4" aria-hidden="true" />
          {sending ? "Sending…" : "Send broadcast"}
        </button>
      </form>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading broadcasts…</p>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No broadcasts yet"
          description="Send your first campaign to re-engage clients or announce a promotion."
        />
      ) : (
        <div className="overflow-hidden rounded-xl border bg-white">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-muted/40 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Campaign</th>
                <th className="px-4 py-3 font-medium">Audience</th>
                <th className="px-4 py-3 font-medium">Channel</th>
                <th className="px-4 py-3 font-medium">Results</th>
                <th className="px-4 py-3 font-medium">Sent</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="px-4 py-3 font-medium">{row.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{audienceLabel(row)}</td>
                  <td className="px-4 py-3 capitalize">{row.channel}</td>
                  <td className="px-4 py-3">
                    {row.sentCount} sent · {row.skippedCount} skipped · {row.failedCount} failed
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.sentAt ? new Date(row.sentAt).toLocaleString() : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
