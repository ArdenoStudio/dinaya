"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AI_FEATURES, AI_FEATURE_META, type AiFeatureKey } from "@/lib/plan-features";

function parseLocationAiConfig(raw: unknown): Record<string, boolean> {
  if (!raw || typeof raw !== "object") return {};
  return raw as Record<string, boolean>;
}

type LocationRow = {
  id: string;
  name: string;
  address: string | null;
  isDefault: boolean;
  aiConfig: Record<string, boolean>;
};

type ContentItem = {
  id: string;
  contentDate: string;
  title: string;
  caption: string;
  status: string;
  error: string | null;
};

type WorkflowRun = {
  id: string;
  feature: string;
  workflowKey: string;
  status: string;
  channel: string | null;
  provider: string | null;
  error: string | null;
  createdAt: string;
};

export default function AiHubClient() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [runs, setRuns] = useState<WorkflowRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const [reactivationResult, setReactivationResult] = useState<{
    stats: { sent: number; skipped: number; failed: number; checked: number };
    previews: { clientName: string; status: string; body?: string }[];
  } | null>(null);

  useEffect(() => {
    async function load() {
      const locRes = await fetch("/api/dashboard/locations");
      const locData = await locRes.json();
      if (!locRes.ok) {
        setError(locData.error ?? "Could not load branches.");
        setLoading(false);
        return;
      }

      const rows: LocationRow[] = Array.isArray(locData) ? locData : [];
      setLocations(
        rows.map((loc) => ({
          ...loc,
          aiConfig: parseLocationAiConfig(loc.aiConfig),
        })),
      );
      const [contentRes, runsRes] = await Promise.all([
        fetch("/api/dashboard/ai/content"),
        fetch("/api/dashboard/ai/runs"),
      ]);
      if (contentRes.status !== 402) {
        const contentData = await contentRes.json();
        setContent(contentData.items ?? []);
      }
      if (runsRes.status !== 402) {
        const runsData = await runsRes.json();
        setRuns(runsData.runs ?? []);
      }
      setLoading(false);
    }
    void load();
  }, []);

  async function toggleFeature(locationId: string, feature: AiFeatureKey, enabled: boolean) {
    setSavingId(locationId);
    const res = await fetch(`/api/dashboard/locations/${locationId}/ai`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [feature]: enabled }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not save AI settings.");
      setSavingId(null);
      return;
    }
    const data = await res.json();
    setLocations((prev) =>
      prev.map((loc) =>
        loc.id === locationId ? { ...loc, aiConfig: data.aiConfig ?? loc.aiConfig } : loc
      )
    );
    setSavingId(null);
  }

  async function generateContent(locationId?: string) {
    setGenerating(true);
    setError("");
    const res = await fetch("/api/dashboard/ai/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not generate content calendar.");
    } else {
      setContent(data.items ?? []);
    }
    setGenerating(false);
  }

  async function updateContent(id: string, action: "approve" | "publish") {
    setError("");
    const res = await fetch(`/api/dashboard/ai/content/${id}/${action}`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? `Could not ${action} content.`);
      return;
    }
    setContent((current) => current.map((item) => item.id === id ? data.item : item));
  }

  async function runReactivationNow() {
    setReactivating(true);
    setError("");
    setReactivationResult(null);
    const res = await fetch("/api/dashboard/ai/reactivate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not run reactivation.");
      setReactivating(false);
      return;
    }
    setReactivationResult(data);
    const runsRes = await fetch("/api/dashboard/ai/runs");
    if (runsRes.ok) {
      const runsData = await runsRes.json();
      setRuns(runsData.runs ?? []);
    }
    setReactivating(false);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading AI hub…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cal text-2xl">AI Growth Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure Growth AI tools per branch. Branch-level workflow controls are included.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <section className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-semibold">Client Reactivation Campaign</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Find clients inactive 30+ days and send a personalised WhatsApp re-engagement message.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void runReactivationNow()}
            disabled={reactivating}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
          >
            {reactivating ? "Running…" : "Run reactivation now"}
          </button>
        </div>
        {reactivationResult ? (
          <div className="mt-4 rounded-lg border bg-muted/20 p-4 text-sm">
            <p>
              Checked {reactivationResult.stats.checked} · Sent {reactivationResult.stats.sent} · Skipped{" "}
              {reactivationResult.stats.skipped} · Failed {reactivationResult.stats.failed}
            </p>
            {reactivationResult.previews.length > 0 ? (
              <ul className="mt-3 space-y-2">
                {reactivationResult.previews.map((preview) => (
                  <li key={preview.clientName} className="rounded border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-3">
                    <p className="font-medium">{preview.clientName} — {preview.status}</p>
                    {preview.body ? (
                      <p className="mt-1 text-xs text-muted-foreground">{preview.body}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
      </section>

      {locations.length === 0 ? (
        <div className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-8 text-center text-muted-foreground">
          Add a location first to configure branch AI.{" "}
          <Link href="/dashboard/locations" className="text-primary hover:underline">
            Manage locations
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {locations.map((loc) => (
            <section key={loc.id} className="overflow-hidden rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900">
              <div className="border-b bg-muted/30 px-5 py-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-semibold">{loc.name}</h2>
                  {loc.isDefault && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                      Default
                    </span>
                  )}
                </div>
                {loc.address && <p className="mt-0.5 text-xs text-muted-foreground">{loc.address}</p>}
              </div>
              <ul className="divide-y">
                {AI_FEATURES.map((feature) => {
                  const meta = AI_FEATURE_META[feature];
                  const on = Boolean(loc.aiConfig[feature]);
                  return (
                    <li key={feature} className="flex items-start gap-4 px-5 py-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{meta.label}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{meta.description}</p>
                      </div>
                      <label className="flex shrink-0 items-center gap-2">
                        <input
                          type="checkbox"
                          checked={on}
                          disabled={savingId === loc.id}
                          onChange={(e) => void toggleFeature(loc.id, feature, e.target.checked)}
                          className="size-4 rounded border-muted-foreground/30"
                        />
                        <span className="text-xs text-muted-foreground">{on ? "On" : "Off"}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <section className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="font-semibold">30-day content machine</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Generate Sri Lanka-local captions and approve before publishing to connected Meta channels.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void generateContent(locations[0]?.id)}
            disabled={generating || locations.length === 0}
            className="rounded-md bg-primary px-3 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {generating ? "Generating..." : "Generate 30 days"}
          </button>
        </div>
        {content.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No content drafts yet.</p>
        ) : (
          <div className="divide-y">
            {content.slice(0, 10).map((item) => (
              <article key={item.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.contentDate} · {item.status}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigator.clipboard?.writeText(item.caption)}
                      className="rounded-md border px-2.5 py-1.5 text-xs font-medium hover:border-primary/40"
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateContent(item.id, "approve")}
                      disabled={item.status === "approved" || item.status === "published"}
                      className="rounded-md border px-2.5 py-1.5 text-xs font-medium hover:border-primary/40 disabled:opacity-50"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => void updateContent(item.id, "publish")}
                      disabled={item.status !== "approved"}
                      className="rounded-md bg-amber-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                    >
                      Publish
                    </button>
                  </div>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{item.caption}</p>
                {item.error && <p className="mt-2 text-xs text-destructive">{item.error}</p>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b px-5 py-4">
          <h2 className="font-semibold">Workflow history</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Provider failures and missing credentials are logged here instead of breaking the workflow.
          </p>
        </div>
        {runs.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No workflow runs yet.</p>
        ) : (
          <div className="divide-y">
            {runs.slice(0, 12).map((run) => (
              <div key={run.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">{run.workflowKey.replaceAll("-", " ")}</p>
                  <p className="text-xs text-muted-foreground">
                    {run.feature} · {run.channel ?? "no channel"} · {run.provider ?? "no provider"}
                  </p>
                  {run.error && <p className="mt-1 text-xs text-destructive">{run.error}</p>}
                </div>
                <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium capitalize text-muted-foreground">
                  {run.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        AI copy uses the configured model provider when available. Without keys, Dinaya falls back to
        deterministic local templates and logs skipped provider actions.
      </p>
    </div>
  );
}
