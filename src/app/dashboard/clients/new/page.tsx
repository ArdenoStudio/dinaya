"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const STAGES = ["lead", "prospect", "active", "churned"] as const;

export default function NewClientPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    stage: "lead" as (typeof STAGES)[number],
    source: "",
    internalNotes: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/dashboard/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }
    const client = await res.json();
    router.push(`/dashboard/clients/${client.id}`);
  }

  return (
    <div className="max-w-lg">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/clients" className="text-muted-foreground hover:text-foreground text-sm">
          ← Clients
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-cal text-2xl">New client</h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-1">Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Phone *</label>
          <input
            required
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Stage</label>
          <select
            value={form.stage}
            onChange={(e) => set("stage", e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {STAGES.map((s) => (
              <option key={s} value={s} className="capitalize">
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Source</label>
          <input
            placeholder="e.g. referral, walk-in, Instagram…"
            value={form.source}
            onChange={(e) => set("source", e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Internal notes</label>
          <textarea
            rows={3}
            value={form.internalNotes}
            onChange={(e) => set("internalNotes", e.target.value)}
            className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-primary text-primary-foreground py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
        >
          {saving ? "Saving…" : "Save client"}
        </button>
      </form>
    </div>
  );
}
