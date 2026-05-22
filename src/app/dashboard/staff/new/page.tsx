"use client";

import Link from "next/link";
import { track } from "@vercel/analytics";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

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
    if (!res.ok) {
      setError(data.error ?? "Error");
      if (res.status === 402) track("plan_limit_reached", { limit: "staff", surface: "new_staff" });
      setLoading(false);
      return;
    }
    router.push("/dashboard/staff");
  }

  return (
    <div className="max-w-lg">
      <h1 className="font-cal text-2xl mb-6">New team member</h1>
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Name *</label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Kamala Silva" />
        </div>
        <div>
          <label className="text-sm font-medium">Short bio</label>
          <textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" rows={2}
            placeholder="5 years experience in…" />
        </div>
        {services.length > 0 && (
          <div>
            <label className="text-sm font-medium">Can perform</label>
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
            <label className="text-sm font-medium">Works at</label>
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

        {error && (
          <div className="rounded-lg border border-violet-200 bg-violet-50 p-3 text-sm">
            <p className="text-destructive">{error}</p>
            {/upgrade/i.test(error) ? (
              <Link
                href="/dashboard/billing"
                onClick={() => track("plan_upgrade_prompt_clicked", { limit: "staff", surface: "new_staff" })}
                className="mt-2 inline-flex rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-700"
              >
                Compare Pro plans
              </Link>
            ) : null}
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button type="submit" disabled={loading}
            className="ml-auto bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </form>
    </div>
  );
}
