"use client";

import { useEffect, useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { DashboardLoadingPanel } from "@/components/dashboard/DashboardLoadingPanel";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DataTable, type DataTableColumn } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import {
  dashboardInputClass,
  dashboardLabelClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

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
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="Broadcasts"
        description="Send a one-time message to client segments by email, WhatsApp, or SMS. Clients who opted out are excluded."
      />

      <DashboardSection title="New broadcast">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className={dashboardLabelClass}>Campaign name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                className={dashboardInputClass}
                placeholder="March promo"
              />
            </label>

            <label className="block">
              <span className={dashboardLabelClass}>Channel</span>
              <select
                value={form.channel}
                onChange={(e) => setForm((current) => ({ ...current, channel: e.target.value as FormState["channel"] }))}
                className={dashboardInputClass}
              >
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="sms">SMS</option>
              </select>
            </label>

            <label className="block">
              <span className={dashboardLabelClass}>Audience</span>
              <select
                value={form.audienceType}
                onChange={(e) => setForm((current) => ({ ...current, audienceType: e.target.value as FormState["audienceType"] }))}
                className={dashboardInputClass}
              >
                <option value="all">All clients</option>
                <option value="stage">By CRM stage</option>
                <option value="tags">By tag</option>
              </select>
            </label>

            {form.audienceType === "stage" ? (
              <label className="block">
                <span className={dashboardLabelClass}>Stage</span>
                <select
                  value={form.stage}
                  onChange={(e) => setForm((current) => ({ ...current, stage: e.target.value as FormState["stage"] }))}
                  className={dashboardInputClass}
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
                <span className={dashboardLabelClass}>Tags (comma-separated)</span>
                <input
                  required
                  value={form.tags}
                  onChange={(e) => setForm((current) => ({ ...current, tags: e.target.value }))}
                  className={dashboardInputClass}
                  placeholder="vip, salon-regular"
                />
              </label>
            ) : null}

            {form.channel === "email" ? (
              <label className="block sm:col-span-2">
                <span className={dashboardLabelClass}>Email subject</span>
                <input
                  value={form.subject}
                  onChange={(e) => setForm((current) => ({ ...current, subject: e.target.value }))}
                  className={dashboardInputClass}
                  placeholder="Special offer this week"
                />
              </label>
            ) : null}

            <label className="block sm:col-span-2">
              <span className={dashboardLabelClass}>Message</span>
              <textarea
                required
                value={form.body}
                onChange={(e) => setForm((current) => ({ ...current, body: e.target.value }))}
                className={cn(dashboardInputClass, "min-h-28")}
                placeholder="Hi {{name}}, we have a special offer for you this week…"
              />
            </label>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

          <button
            type="submit"
            disabled={sending}
            className={dashboardPrimaryActionClass}
          >
            <Send className="size-4" aria-hidden="true" />
            {sending ? "Sending…" : "Send broadcast"}
          </button>
        </form>
      </DashboardSection>

      {loading ? (
        <DashboardLoadingPanel rows={3} />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="No broadcasts yet"
          description="Send your first campaign to re-engage clients or announce a promotion."
        />
      ) : (
        <DataTable
          columns={broadcastColumns}
          rows={rows}
          getRowId={(row) => row.id}
          mobileCard={(row) => (
            <div key={row.id} className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">{row.name}</p>
                <span className="shrink-0 text-xs capitalize text-muted-foreground">{row.channel}</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{audienceLabel(row)}</p>
              <p className="mt-2 text-sm">
                {row.sentCount} sent · {row.skippedCount} skipped · {row.failedCount} failed
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {row.sentAt ? new Date(row.sentAt).toLocaleString() : "Not sent"}
              </p>
            </div>
          )}
        />
      )}
    </div>
  );
}

const broadcastColumns: DataTableColumn<BroadcastRow>[] = [
  { key: "name", header: "Campaign", render: (row) => <span className="font-medium">{row.name}</span> },
  { key: "audience", header: "Audience", render: (row) => <span className="text-muted-foreground">{audienceLabel(row)}</span> },
  { key: "channel", header: "Channel", render: (row) => <span className="capitalize">{row.channel}</span> },
  {
    key: "results",
    header: "Results",
    render: (row) => `${row.sentCount} sent · ${row.skippedCount} skipped · ${row.failedCount} failed`,
  },
  {
    key: "sentAt",
    header: "Sent",
    render: (row) => (
      <span className="text-muted-foreground">
        {row.sentAt ? new Date(row.sentAt).toLocaleString() : "—"}
      </span>
    ),
  },
];
