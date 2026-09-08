"use client";

import { useEffect, useState } from "react";
import { Megaphone, Send } from "lucide-react";
import { DashboardLoadingPanel } from "@/components/dashboard/DashboardLoadingPanel";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import { DataTable, type DataTableColumn } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { DashboardSelect, DashboardTextAreaField, DashboardTextField } from "@/components/dashboard/DashboardFormField";
import {
  dashboardPageClass,
  dashboardPrimaryActionClass,
} from "@/lib/dashboard-ui";

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
            <DashboardTextField
              label="Campaign name"
              isRequired
              className="sm:col-span-2"
              value={form.name}
              onChange={(name) => setForm((current) => ({ ...current, name }))}
              placeholder="March promo"
            />

            <DashboardSelect
              label="Channel"
              value={form.channel}
              onChange={(channel) => setForm((current) => ({ ...current, channel }))}
              options={[
                { value: "email", label: "Email" },
                { value: "whatsapp", label: "WhatsApp" },
                { value: "sms", label: "SMS" },
              ]}
            />

            <DashboardSelect
              label="Audience"
              value={form.audienceType}
              onChange={(audienceType) => setForm((current) => ({ ...current, audienceType }))}
              options={[
                { value: "all", label: "All clients" },
                { value: "stage", label: "By CRM stage" },
                { value: "tags", label: "By tag" },
              ]}
            />

            {form.audienceType === "stage" ? (
              <DashboardSelect
                label="Stage"
                value={form.stage}
                onChange={(stage) => setForm((current) => ({ ...current, stage }))}
                options={[
                  { value: "lead", label: "Lead" },
                  { value: "prospect", label: "Prospect" },
                  { value: "active", label: "Active" },
                  { value: "churned", label: "Churned" },
                ]}
              />
            ) : null}

            {form.audienceType === "tags" ? (
              <DashboardTextField
                label="Tags (comma-separated)"
                isRequired
                className="sm:col-span-2"
                value={form.tags}
                onChange={(tags) => setForm((current) => ({ ...current, tags }))}
                placeholder="vip, salon-regular"
              />
            ) : null}

            {form.channel === "email" ? (
              <DashboardTextField
                label="Email subject"
                className="sm:col-span-2"
                value={form.subject}
                onChange={(subject) => setForm((current) => ({ ...current, subject }))}
                placeholder="Special offer this week"
              />
            ) : null}

            <DashboardTextAreaField
              label="Message"
              isRequired
              className="sm:col-span-2"
              rows={5}
              value={form.body}
              onChange={(body) => setForm((current) => ({ ...current, body }))}
              placeholder="Hi {{name}}, we have a special offer for you this week…"
            />
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
