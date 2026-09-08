"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "@heroui/react";
import { DIRECTORY_CATEGORIES, DIRECTORY_CITIES } from "@/lib/directory";
import { DashboardSelect, DashboardSwitch, DashboardTextField } from "@/components/dashboard/DashboardFormField";
import {
  dashboardErrorAlertClass,
  dashboardPrimaryActionClass,
  dashboardSurfaceClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

const CITY_OPTIONS = DIRECTORY_CITIES.map((city) => ({ value: city, label: city }));
const CATEGORY_OPTIONS = DIRECTORY_CATEGORIES.map(({ value, label }) => ({ value, label }));

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
    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      setError(data.error ?? "Could not save directory settings.");
    } else {
      toast.success("Directory settings saved");
    }
    setSaving(false);
  }

  if (loading) {
    return <div className={cn(dashboardSurfaceClass, "p-5 text-sm text-muted-foreground")}>Loading directory settings…</div>;
  }

  return (
    <form onSubmit={handleSave} className={cn(dashboardSurfaceClass, "p-5 space-y-4")}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-cal text-base tracking-tight">Dinaya Directory</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Opt in to be discovered on <Link href="/discover" className="text-primary hover:underline">dinaya.lk/discover</Link>. Free, no commission.
          </p>
        </div>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium",
            form.directoryListed ? "bg-green-100 text-green-700" : "bg-muted text-muted-foreground",
          )}
        >
          {form.directoryListed ? "Listed" : "Not listed"}
        </span>
      </div>

      <DashboardSwitch
        label="List this business on the directory"
        isSelected={form.directoryListed}
        onChange={(isSelected) => setForm((current) => ({ ...current, directoryListed: isSelected }))}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <DashboardSelect
          label="City"
          value={form.directoryCity}
          onChange={(value) => setForm((current) => ({ ...current, directoryCity: value }))}
          options={CITY_OPTIONS}
        />
        <DashboardSelect
          label="Category"
          value={form.directoryCategory}
          onChange={(value) => setForm((current) => ({ ...current, directoryCategory: value }))}
          options={CATEGORY_OPTIONS}
        />
        <DashboardTextField
          label="District"
          hint="Optional — helps clients narrow down your area."
          className="md:col-span-2"
          value={form.directoryDistrict}
          onChange={(value) => setForm((current) => ({ ...current, directoryDistrict: value }))}
          placeholder="e.g. Colombo District"
        />
      </div>

      {error ? <p className={dashboardErrorAlertClass}>{error}</p> : null}

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" disabled={saving} className={cn(dashboardPrimaryActionClass, "disabled:opacity-60")}>
          {saving ? "Saving…" : "Save directory settings"}
        </button>
      </div>
    </form>
  );
}
