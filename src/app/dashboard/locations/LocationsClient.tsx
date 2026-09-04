"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { DashboardLoadingPanel } from "@/components/dashboard/DashboardLoadingPanel";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Icon } from "@/components/ui/Icon";
import {
  dashboardErrorAlertClass,
  dashboardInputClass,
  dashboardLabelClass,
  dashboardOutlineActionClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
  dashboardSectionClass,
  dashboardSurfaceClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

type LocationRow = {
  id: string;
  name: string;
  slug: string | null;
  address: string | null;
  phone: string | null;
  timezone: string;
  isActive: boolean;
  isDefault: boolean;
  sortOrder: number;
  staffCount: number;
};

type Props = {
  plan: string;
  locationLimit: number | null;
};

export default function LocationsClient({ plan, locationLimit }: Props) {
  const [locations, setLocations] = useState<LocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", address: "", phone: "" });

  async function load() {
    setLoading(true);
    const res = await fetch("/api/dashboard/locations");
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not load locations.");
      setLoading(false);
      return;
    }
    setLocations(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  const atLimit = locationLimit !== null && locations.length >= locationLimit;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/dashboard/locations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        address: form.address || null,
        phone: form.phone || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create location.");
      setSaving(false);
      return;
    }
    setForm({ name: "", address: "", phone: "" });
    setShowForm(false);
    setSaving(false);
    await load();
  }

  async function setDefault(id: string) {
    await fetch(`/api/dashboard/locations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    await load();
  }

  async function toggleActive(id: string, isActive: boolean) {
    await fetch(`/api/dashboard/locations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    await load();
  }

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="Locations"
        description={
          <>
            Manage branches for your booking page and dashboard.
            {locationLimit !== null && (
              <span className="ml-1">
                ({locations.length}/{locationLimit} on {plan} plan)
              </span>
            )}
          </>
        }
        actions={
          !atLimit ? (
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className={dashboardPrimaryActionClass}
            >
              <Icon name="plus" className="text-xs" /> Add location
            </button>
          ) : undefined
        }
      />

      {atLimit && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200">
          You&apos;ve reached your plan limit of {locationLimit} location{locationLimit === 1 ? "" : "s"}.{" "}
          <Link href="/dashboard/billing" className="font-medium underline">
            Upgrade
          </Link>{" "}
          to add more branches.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className={cn(dashboardSectionClass, "max-w-lg space-y-4")}>
          <h2 className="font-cal text-lg tracking-tight">New branch</h2>
          <div>
            <label className={dashboardLabelClass}>Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={dashboardInputClass}
              placeholder="Colombo 7 branch"
            />
          </div>
          <div>
            <label className={dashboardLabelClass}>Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className={dashboardInputClass}
            />
          </div>
          <div>
            <label className={dashboardLabelClass}>Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={dashboardInputClass}
            />
          </div>
          {error && <p className={dashboardErrorAlertClass}>{error}</p>}
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => setShowForm(false)} className={dashboardOutlineActionClass}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className={cn(dashboardPrimaryActionClass, "ml-auto")}
            >
              {saving ? "Saving…" : "Create"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <DashboardLoadingPanel rows={2} />
      ) : locations.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No locations yet"
          description="Add your first branch so clients can pick where to book."
          action={
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className={dashboardPrimaryActionClass}
            >
              <Icon name="plus" className="text-xs" /> Add location
            </button>
          }
        />
      ) : (
        <div className={cn(dashboardSurfaceClass, "divide-y overflow-hidden")}>
          {locations.map((loc) => (
            <div key={loc.id} className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-muted/20">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{loc.name}</p>
                  {loc.isDefault && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-primary">
                      Default
                    </span>
                  )}
                  {!loc.isActive && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-muted-foreground">
                      Inactive
                    </span>
                  )}
                </div>
                {loc.address && <p className="mt-0.5 truncate text-xs text-muted-foreground">{loc.address}</p>}
                <p className="mt-1 text-xs text-muted-foreground">
                  {loc.staffCount} staff · {loc.timezone}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {!loc.isDefault && (
                  <button
                    type="button"
                    onClick={() => void setDefault(loc.id)}
                    className={cn(dashboardOutlineActionClass, "px-2.5 py-1 text-xs")}
                  >
                    Set default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void toggleActive(loc.id, loc.isActive)}
                  className={cn(dashboardOutlineActionClass, "px-2.5 py-1 text-xs")}
                >
                  {loc.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && !showForm && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
