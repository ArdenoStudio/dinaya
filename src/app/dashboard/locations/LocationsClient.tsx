"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-cal text-2xl">Locations</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage branches for your booking page and dashboard.
            {locationLimit !== null && (
              <span className="ml-1">
                ({locations.length}/{locationLimit} on {plan} plan)
              </span>
            )}
          </p>
        </div>
        {!atLimit && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 rounded-md border-b-2 border-primary/70 bg-gradient-to-b from-primary/90 to-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:shadow-md hover:shadow-primary/30"
          >
            <i className="bi bi-plus text-xs" /> Add location
          </button>
        )}
      </div>

      {atLimit && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          You&apos;ve reached your plan limit of {locationLimit} location{locationLimit === 1 ? "" : "s"}.{" "}
          <Link href="/dashboard/billing" className="font-medium underline">
            Upgrade
          </Link>{" "}
          to add more branches.
        </div>
      )}

      {showForm && (
        <form onSubmit={handleCreate} className="mb-6 rounded-xl border bg-white p-6 space-y-4 max-w-lg">
          <h2 className="font-medium">New branch</h2>
          <div>
            <label className="text-sm font-medium">Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Colombo 7 branch"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="text-sm text-muted-foreground">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="ml-auto rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create"}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : locations.length === 0 ? (
        <div className="rounded-xl border bg-white p-12 text-center text-muted-foreground">
          No locations yet. Add your first branch to get started.
        </div>
      ) : (
        <div className="divide-y rounded-xl border bg-white">
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
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-gray-500">
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
                    className="rounded border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40"
                  >
                    Set default
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void toggleActive(loc.id, loc.isActive)}
                  className="rounded border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:border-primary/40"
                >
                  {loc.isActive ? "Deactivate" : "Activate"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && error && !showForm && <p className="mt-4 text-sm text-destructive">{error}</p>}
    </div>
  );
}
