"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AI_FEATURES, AI_FEATURE_META, type AiFeatureKey } from "@/lib/plan-features";

type LocationRow = {
  id: string;
  name: string;
  address: string | null;
  isDefault: boolean;
  aiConfig: Record<string, boolean>;
};

export default function AiHubClient() {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

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
      const withAi = await Promise.all(
        rows.map(async (loc) => {
          const aiRes = await fetch(`/api/dashboard/locations/${loc.id}/ai`);
          if (aiRes.status === 402) {
            setLocked(true);
            return { ...loc, aiConfig: {} };
          }
          const aiData = await aiRes.json();
          return { ...loc, aiConfig: aiData.aiConfig ?? {} };
        })
      );
      setLocations(withAi);
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

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading AI hub…</p>;
  }

  if (locked) {
    return (
      <div className="rounded-xl border border-violet-200 bg-violet-50/70 p-8 text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-violet-600 text-white">
          <i className="bi bi-stars text-lg" aria-hidden="true" />
        </div>
        <h1 className="font-cal text-2xl text-violet-950">AI Growth Hub</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-violet-900/75">
          Per-branch AI tools — booking autopilot, smart reminders, review engine, and more — are
          available on Dinaya Max.
        </p>
        <Link
          href="/dashboard/billing"
          className="mt-6 inline-flex rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Upgrade to Max
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cal text-2xl">AI Growth Hub</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure AI tools per branch. Each location can run its own automations independently.
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {locations.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-muted-foreground">
          Add a location first to configure branch AI.{" "}
          <Link href="/dashboard/locations" className="text-primary hover:underline">
            Manage locations
          </Link>
        </div>
      ) : (
        <div className="grid gap-6">
          {locations.map((loc) => (
            <section key={loc.id} className="overflow-hidden rounded-xl border bg-white">
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

      <p className="text-xs text-muted-foreground">
        AI features store per-branch preferences. Full LLM integrations will activate as each tool
        rolls out — toggles here control which branches participate.
      </p>
    </div>
  );
}
