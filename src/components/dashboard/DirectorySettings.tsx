"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DIRECTORY_CATEGORIES, DIRECTORY_CITIES } from "@/lib/directory";

type DirectoryState = {
  directoryListed: boolean;
  directoryCity: string;
  directoryDistrict: string;
  directoryCategory: string;
  suggestedCategory: string;
};

export function DirectorySettings() {
  const [form, setForm] = useState<DirectoryState>({
    directoryListed: false,
    directoryCity: "Colombo",
    directoryDistrict: "",
    directoryCategory: "other",
    suggestedCategory: "other",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/directory")
      .then((response) => response.json())
      .then((data: DirectoryState) => {
        setForm({
          directoryListed: Boolean(data.directoryListed),
          directoryCity: data.directoryCity ?? "Colombo",
          directoryDistrict: data.directoryDistrict ?? "",
          directoryCategory: data.directoryCategory ?? data.suggestedCategory ?? "other",
          suggestedCategory: data.suggestedCategory ?? "other",
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");

    const response = await fetch("/api/dashboard/directory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json().catch(() => ({})) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Could not save directory settings.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }

    setSaving(false);
  }

  if (loading) {
    return <div className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5 text-sm text-muted-foreground">Loading directory settings…</div>;
  }

  return (
    <form onSubmit={handleSave} className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">Dinaya Directory</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Opt in to be discovered on <Link href="/discover" className="text-primary hover:underline">dinaya.lk/discover</Link>. Free, no commission.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.directoryListed}
            onChange={(event) => setForm((current) => ({ ...current, directoryListed: event.target.checked }))}
          />
          Listed
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          City
          <select
            value={form.directoryCity}
            onChange={(event) => setForm((current) => ({ ...current, directoryCity: event.target.value }))}
            className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm"
          >
            {DIRECTORY_CITIES.map((city) => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          Category
          <select
            value={form.directoryCategory}
            onChange={(event) => setForm((current) => ({ ...current, directoryCategory: event.target.value }))}
            className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm"
          >
            {DIRECTORY_CATEGORIES.map((category) => (
              <option key={category.value} value={category.value}>{category.label}</option>
            ))}
          </select>
        </label>

        <label className="text-sm md:col-span-2">
          District (optional)
          <input
            value={form.directoryDistrict}
            onChange={(event) => setForm((current) => ({ ...current, directoryDistrict: event.target.value }))}
            className="mt-1 w-full rounded-lg border px-3 py-2.5 text-sm"
            placeholder="e.g. Colombo District"
          />
        </label>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      <div className="mt-4 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save directory settings"}
        </button>
        {saved ? <span className="text-sm text-emerald-600">Saved</span> : null}
      </div>
    </form>
  );
}
