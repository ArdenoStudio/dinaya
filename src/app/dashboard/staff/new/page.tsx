"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface Service { id: string; name: string; }

export default function NewStaffPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", bio: "" });
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/services").then((r) => r.json()).then((d) => setServices(d ?? []));
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
      body: JSON.stringify({ ...form, serviceIds: selectedServices }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Error"); setLoading(false); return; }
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
        {error && <p className="text-destructive text-sm">{error}</p>}
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
