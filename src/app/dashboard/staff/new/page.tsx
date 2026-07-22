"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import {
  dashboardErrorAlertClass,
  dashboardInputClass,
  dashboardLabelClass,
  dashboardOutlineActionClass,
  dashboardPageClass,
  dashboardPrimaryActionClass,
  dashboardSectionClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

interface Service { id: string; name: string; }
interface LocationOption { id: string; name: string; }

export default function NewStaffPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", bio: "" });
  const [services, setServices] = useState<Service[]>([]);
  const [locations, setLocations] = useState<LocationOption[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/dashboard/services").then((r) => r.json()),
      fetch("/api/dashboard/locations").then((r) => r.json()),
    ]).then(([serviceList, locationList]) => {
      setServices(Array.isArray(serviceList) ? serviceList : []);
      setLocations(Array.isArray(locationList) ? locationList.map((l: LocationOption) => ({ id: l.id, name: l.name })) : []);
    });
  }, []);

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/dashboard/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, serviceIds: selectedServices, locationIds: selectedLocations }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error"); setLoading(false); return; }
    router.push("/dashboard/staff");
  }

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="New team member"
        backHref="/dashboard/staff"
        backLabel="Staff"
      />

      <form onSubmit={handleSubmit} className={cn(dashboardSectionClass, "max-w-lg space-y-4")}>
        <div>
          <label className={dashboardLabelClass}>Name *</label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className={dashboardInputClass}
            placeholder="Kamala Silva" />
        </div>
        <div>
          <label className={dashboardLabelClass}>Short bio</label>
          <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className={cn(dashboardInputClass, "resize-none")} rows={2}
            placeholder="5 years experience in…" />
        </div>
        {services.length > 0 && (
          <div>
            <label className={dashboardLabelClass}>Can perform</label>
            <div className="mt-2 space-y-1">
              {services.map((s) => (
                <label key={s.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedServices.includes(s.id)}
                    onChange={() => toggleService(s.id)} className="rounded" />
                  <span className="text-sm">{s.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        {locations.length > 1 && (
          <div>
            <label className={dashboardLabelClass}>Works at</label>
            <div className="mt-2 space-y-1">
              {locations.map((loc) => (
                <label key={loc.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedLocations.includes(loc.id)}
                    onChange={() => setSelectedLocations((prev) => prev.includes(loc.id) ? prev.filter((id) => id !== loc.id) : [...prev, loc.id])}
                    className="rounded" />
                  <span className="text-sm">{loc.name}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <p className={dashboardErrorAlertClass}>{error}</p>}
        <div className="flex flex-wrap gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className={dashboardOutlineActionClass}>
            Cancel
          </button>
          <button type="submit" disabled={loading} className={cn(dashboardPrimaryActionClass, "ml-auto")}>
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
