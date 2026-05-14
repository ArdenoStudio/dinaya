"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface ServiceForm {
  name: string;
  description: string;
  durationMinutes: number;
  priceLkr: number;
  requiresPayment: boolean;
  isActive: boolean;
  beforeBuffer: number;
  afterBuffer: number;
  minimumNoticeHours: number;
  dailyCapacity: string | number;
}

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<ServiceForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/dashboard/services/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setForm({
          name: d.name ?? "",
          description: d.description ?? "",
          durationMinutes: d.durationMinutes ?? 30,
          priceLkr: d.priceLkr ?? 0,
          requiresPayment: d.requiresPayment ?? false,
          isActive: d.isActive ?? true,
          beforeBuffer: d.beforeBuffer ?? 0,
          afterBuffer: d.afterBuffer ?? 0,
          minimumNoticeHours: d.minimumNoticeHours ?? 0,
          dailyCapacity: d.dailyCapacity ?? "",
        });
        setLoading(false);
      });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    const res = await fetch(`/api/dashboard/services/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        dailyCapacity: form.dailyCapacity === "" ? null : Number(form.dailyCapacity),
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Error saving");
      setSaving(false);
      return;
    }
    router.push("/dashboard/services");
  }

  async function handleDelete() {
    if (!confirm("Delete this service? This cannot be undone.")) return;
    setDeleting(true);
    await fetch(`/api/dashboard/services/${id}`, { method: "DELETE" });
    router.push("/dashboard/services");
  }

  if (loading) return <div className="text-muted-foreground text-sm">Loading…</div>;
  if (!form) return <div className="text-muted-foreground text-sm">Service not found.</div>;

  const inputCls = "mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary";
  const selectCls = inputCls;

  return (
    <div className="max-w-lg">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cal text-2xl">Edit service</h1>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-sm text-destructive hover:underline disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete service"}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Service name *</label>
          <input required value={form.name}
            onChange={(e) => setForm((f) => f && ({ ...f, name: e.target.value }))}
            className={inputCls} placeholder="e.g. Haircut" />
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea value={form.description}
            onChange={(e) => setForm((f) => f && ({ ...f, description: e.target.value }))}
            className={`${inputCls} resize-none`} rows={2} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium">Duration (minutes) *</label>
            <input type="number" min={5} max={480} required value={form.durationMinutes}
              onChange={(e) => setForm((f) => f && ({ ...f, durationMinutes: parseInt(e.target.value) }))}
              className={inputCls} />
          </div>
          <div>
            <label className="text-sm font-medium">Price (LKR)</label>
            <input type="number" min={0} value={form.priceLkr}
              onChange={(e) => setForm((f) => f && ({ ...f, priceLkr: parseInt(e.target.value) || 0 }))}
              className={inputCls} />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Buffer time</label>
          <p className="text-xs text-muted-foreground mb-2">Block time before/after each appointment.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Before (minutes)</label>
              <select value={form.beforeBuffer}
                onChange={(e) => setForm((f) => f && ({ ...f, beforeBuffer: parseInt(e.target.value) }))}
                className={selectCls}>
                {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>{m === 0 ? "No buffer" : `${m} min`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">After (minutes)</label>
              <select value={form.afterBuffer}
                onChange={(e) => setForm((f) => f && ({ ...f, afterBuffer: parseInt(e.target.value) }))}
                className={selectCls}>
                {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>{m === 0 ? "No buffer" : `${m} min`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="text-sm font-medium">Minimum notice</label>
          <p className="text-xs text-muted-foreground mb-2">How far in advance must clients book?</p>
          <select value={form.minimumNoticeHours}
            onChange={(e) => setForm((f) => f && ({ ...f, minimumNoticeHours: parseInt(e.target.value) }))}
            className={selectCls}>
            {[0, 1, 2, 4, 6, 12, 24, 48, 72].map((h) => (
              <option key={h} value={h}>{h === 0 ? "No minimum" : h < 24 ? `${h} hour${h > 1 ? "s" : ""}` : `${h / 24} day${h / 24 > 1 ? "s" : ""}`}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Daily capacity</label>
          <p className="text-xs text-muted-foreground mb-2">Max bookings per staff per day. Leave blank for unlimited.</p>
          <input type="number" min={1} max={100} value={form.dailyCapacity}
            onChange={(e) => setForm((f) => f && ({ ...f, dailyCapacity: e.target.value }))}
            placeholder="Unlimited" className={inputCls} />
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.requiresPayment}
              onChange={(e) => setForm((f) => f && ({ ...f, requiresPayment: e.target.checked }))}
              className="rounded" />
            <span className="text-sm">Require payment</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.isActive}
              onChange={(e) => setForm((f) => f && ({ ...f, isActive: e.target.checked }))}
              className="rounded" />
            <span className="text-sm">Active</span>
          </label>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
          <button type="submit" disabled={saving}
            className="ml-auto bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
