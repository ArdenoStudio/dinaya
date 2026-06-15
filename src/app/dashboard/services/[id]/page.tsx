"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";

interface ServiceForm {
  name: string;
  description: string;
  durationMinutes: number;
  priceLkr: number;
  depositPercent: number;
  requiresPayment: boolean;
  isActive: boolean;
  beforeBuffer: number;
  afterBuffer: number;
  minimumNoticeHours: number;
  dailyCapacity: string | number;
  maximumAdvanceDays: number;
}

interface StaffMember {
  id: string;
  name: string;
}

export default function EditServicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<ServiceForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [allStaff, setAllStaff] = useState<StaffMember[]>([]);
  const [assignedStaffIds, setAssignedStaffIds] = useState<string[]>([]);
  const [savingStaff, setSavingStaff] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/dashboard/services/${id}`).then((r) => r.json()),
      fetch(`/api/dashboard/staff`).then((r) => r.json()),
      fetch(`/api/dashboard/services/${id}/staff`).then((r) => r.json()),
    ]).then(([d, staffList, assignedList]) => {
      setForm({
        name: d.name ?? "",
        description: d.description ?? "",
        durationMinutes: d.durationMinutes ?? 30,
        priceLkr: d.priceLkr ?? 0,
        depositPercent: d.depositPercent ?? 0,
        requiresPayment: d.requiresPayment ?? false,
        isActive: d.isActive ?? true,
        beforeBuffer: d.beforeBuffer ?? 0,
        afterBuffer: d.afterBuffer ?? 0,
        minimumNoticeHours: d.minimumNoticeHours ?? 0,
        dailyCapacity: d.dailyCapacity ?? "",
        maximumAdvanceDays: d.maximumAdvanceDays ?? 0,
      });
      setAllStaff(Array.isArray(staffList) ? staffList : []);
      setAssignedStaffIds(
        Array.isArray(assignedList) ? assignedList.map((s: StaffMember) => s.id) : []
      );
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
        maximumAdvanceDays: form.maximumAdvanceDays || null,
      }),
    });
    if (!res.ok) {
      const d = await res.json();
      if (res.status === 409 && form.isActive === false && window.confirm(d.error)) {
        const forced = await fetch(`/api/dashboard/services/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            dailyCapacity: form.dailyCapacity === "" ? null : Number(form.dailyCapacity),
            maximumAdvanceDays: form.maximumAdvanceDays || null,
            forceDeactivate: true,
          }),
        });
        if (forced.ok) {
          router.push("/dashboard/services");
          return;
        }
      }
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

  function toggleStaff(staffId: string) {
    setAssignedStaffIds((prev) =>
      prev.includes(staffId) ? prev.filter((s) => s !== staffId) : [...prev, staffId]
    );
  }

  async function handleSaveStaff() {
    setSavingStaff(true);
    await fetch(`/api/dashboard/services/${id}/staff`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffIds: assignedStaffIds }),
    });
    setSavingStaff(false);
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

        <div>
          <label className="text-sm font-medium">Booking window</label>
          <p className="text-xs text-muted-foreground mb-2">How far ahead can clients book this service?</p>
          <select value={form.maximumAdvanceDays}
            onChange={(e) => setForm((f) => f && ({ ...f, maximumAdvanceDays: parseInt(e.target.value) }))}
            className={selectCls}>
            {([[0, "No limit"], [7, "1 week"], [14, "2 weeks"], [30, "1 month"], [60, "2 months"], [90, "3 months"], [180, "6 months"], [365, "1 year"]] as [number, string][]).map(([d, labelText]) => (
              <option key={d} value={d}>{labelText}</option>
            ))}
          </select>
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

        {form.requiresPayment && (
          <div>
            <label className="text-sm font-medium">Deposit percentage</label>
            <p className="text-xs text-muted-foreground mb-2">
              Use 0 for full payment, or collect a smaller deposit to reduce no-shows.
            </p>
            <input
              type="number"
              min={0}
              max={100}
              value={form.depositPercent}
              onChange={(e) => setForm((f) => f && ({ ...f, depositPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
              className={inputCls}
            />
          </div>
        )}


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

      {/* Staff assignment */}
      <div className="bg-white border rounded-xl p-6 mt-6">
        <h2 className="text-base font-semibold mb-1">Team members</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Choose which staff members offer this service.
        </p>
        {allStaff.length === 0 ? (
          <p className="text-sm text-muted-foreground">No staff members yet. Add staff first.</p>
        ) : (
          <div className="space-y-2 mb-4">
            {allStaff.map((member) => (
              <label key={member.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={assignedStaffIds.includes(member.id)}
                  onChange={() => toggleStaff(member.id)}
                  className="rounded"
                />
                <span className="text-sm">{member.name}</span>
              </label>
            ))}
          </div>
        )}
        {allStaff.length > 0 && (
          <button
            onClick={handleSaveStaff}
            disabled={savingStaff}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {savingStaff ? "Saving…" : "Save team"}
          </button>
        )}
      </div>
    </div>
  );
}
