"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { IntakeQuestionsEditor } from "@/components/dashboard/IntakeQuestionsEditor";
import { PriceVariantsEditor } from "@/components/dashboard/PriceVariantsEditor";
import { DashboardPageHeader } from "@/components/dashboard/DashboardPageHeader";
import { DashboardSection } from "@/components/dashboard/DashboardSection";
import type { IntakeQuestion } from "@/lib/intake";
import { minPriceVariantLkr, type ServicePriceVariant } from "@/lib/service-variants";
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

interface ServiceForm {
  name: string;
  description: string;
  imageUrl: string;
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
  intakeQuestions: IntakeQuestion[];
  priceVariants: ServicePriceVariant[];
  successRedirectUrl: string;
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
  const [forceDeactivateError, setForceDeactivateError] = useState<string | null>(null);
  const [forcingDeactivate, setForcingDeactivate] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/dashboard/services/${id}`).then((r) => r.json()),
      fetch(`/api/dashboard/staff`).then((r) => r.json()),
      fetch(`/api/dashboard/services/${id}/staff`).then((r) => r.json()),
    ]).then(([d, staffList, assignedList]) => {
      setForm({
        name: d.name ?? "",
        description: d.description ?? "",
        imageUrl: d.imageUrl ?? "",
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
        intakeQuestions: d.intakeQuestions ?? [],
        priceVariants: d.priceVariants ?? [],
        successRedirectUrl: d.successRedirectUrl ?? "",
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
      if (res.status === 409 && form.isActive === false) {
        setForceDeactivateError(d.error ?? "This service has upcoming bookings.");
        setSaving(false);
        return;
      }
      setError(d.error ?? "Error saving");
      setSaving(false);
      return;
    }
    router.push("/dashboard/services");
  }

  async function handleForceDeactivate() {
    if (!form) return;
    setForcingDeactivate(true);
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
    setForcingDeactivate(false);
    setForceDeactivateError(null);
    if (forced.ok) {
      router.push("/dashboard/services");
    } else {
      const d = await forced.json();
      setError(d.error ?? "Error saving");
    }
  }

  async function handleDelete() {
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

  if (loading) return <div className={cn(dashboardPageClass, "text-sm text-muted-foreground")}>Loading…</div>;
  if (!form) return <div className={cn(dashboardPageClass, "text-sm text-muted-foreground")}>Service not found.</div>;

  return (
    <div className={dashboardPageClass}>
      <DashboardPageHeader
        title="Edit service"
        backHref="/dashboard/services"
        backLabel="Services"
        actions={
          <ConfirmDialog
            title="Delete service"
            description="Delete this service? This cannot be undone."
            confirmLabel="Delete"
            onConfirm={handleDelete}
            trigger={
              <button
                type="button"
                disabled={deleting}
                className="text-sm text-destructive hover:underline disabled:opacity-50"
              >
                {deleting ? "Deleting…" : "Delete service"}
              </button>
            }
          />
        }
      />

      <form onSubmit={handleSubmit} className={cn(dashboardSectionClass, "max-w-lg space-y-4")}>
        <div>
          <label className={dashboardLabelClass}>Service name *</label>
          <input required value={form.name}
            onChange={(e) => setForm((f) => f && ({ ...f, name: e.target.value }))}
            className={dashboardInputClass} placeholder="e.g. Haircut" />
        </div>

        <div>
          <label className={dashboardLabelClass}>Description</label>
          <textarea value={form.description}
            onChange={(e) => setForm((f) => f && ({ ...f, description: e.target.value }))}
            className={cn(dashboardInputClass, "resize-none")} rows={2} />
        </div>

        <div>
          <label className={dashboardLabelClass}>Cover image URL</label>
          <input
            value={form.imageUrl}
            onChange={(e) => setForm((f) => f && ({ ...f, imageUrl: e.target.value }))}
            className={dashboardInputClass}
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={dashboardLabelClass}>Duration (minutes) *</label>
            <input type="number" min={5} max={480} required value={form.durationMinutes}
              onChange={(e) => setForm((f) => f && ({ ...f, durationMinutes: parseInt(e.target.value) }))}
              className={dashboardInputClass} />
          </div>
          <div>
            <label className={dashboardLabelClass}>Price (LKR)</label>
            <input type="number" min={0} value={form.priceLkr}
              onChange={(e) => setForm((f) => f && ({ ...f, priceLkr: parseInt(e.target.value) || 0 }))}
              className={dashboardInputClass} />
            {form.priceVariants.length > 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Only shown as a fallback — clients pick from your price options below.
              </p>
            )}
          </div>
        </div>

        <PriceVariantsEditor
          value={form.priceVariants}
          onChange={(priceVariants) =>
            setForm((f) => {
              if (!f) return f;
              const min = minPriceVariantLkr(priceVariants);
              return { ...f, priceVariants, priceLkr: min ?? f.priceLkr };
            })
          }
        />

        <div>
          <label className={dashboardLabelClass}>Buffer time</label>
          <p className="text-xs text-muted-foreground mb-2">Block time before/after each appointment.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground">Before (minutes)</label>
              <select value={form.beforeBuffer}
                onChange={(e) => setForm((f) => f && ({ ...f, beforeBuffer: parseInt(e.target.value) }))}
                className={dashboardInputClass}>
                {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>{m === 0 ? "No buffer" : `${m} min`}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground">After (minutes)</label>
              <select value={form.afterBuffer}
                onChange={(e) => setForm((f) => f && ({ ...f, afterBuffer: parseInt(e.target.value) }))}
                className={dashboardInputClass}>
                {[0, 5, 10, 15, 20, 30, 45, 60].map((m) => (
                  <option key={m} value={m}>{m === 0 ? "No buffer" : `${m} min`}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className={dashboardLabelClass}>Minimum notice</label>
          <p className="text-xs text-muted-foreground mb-2">How far in advance must clients book?</p>
          <select value={form.minimumNoticeHours}
            onChange={(e) => setForm((f) => f && ({ ...f, minimumNoticeHours: parseInt(e.target.value) }))}
            className={dashboardInputClass}>
            {[0, 1, 2, 4, 6, 12, 24, 48, 72].map((h) => (
              <option key={h} value={h}>{h === 0 ? "No minimum" : h < 24 ? `${h} hour${h > 1 ? "s" : ""}` : `${h / 24} day${h / 24 > 1 ? "s" : ""}`}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={dashboardLabelClass}>Daily capacity</label>
          <p className="text-xs text-muted-foreground mb-2">Max bookings per staff per day. Leave blank for unlimited.</p>
          <input type="number" min={1} max={100} value={form.dailyCapacity}
            onChange={(e) => setForm((f) => f && ({ ...f, dailyCapacity: e.target.value }))}
            placeholder="Unlimited" className={dashboardInputClass} />
        </div>

        <div>
          <label className={dashboardLabelClass}>Booking window</label>
          <p className="text-xs text-muted-foreground mb-2">How far ahead can clients book this service?</p>
          <select value={form.maximumAdvanceDays}
            onChange={(e) => setForm((f) => f && ({ ...f, maximumAdvanceDays: parseInt(e.target.value) }))}
            className={dashboardInputClass}>
            {([[0, "No limit"], [7, "1 week"], [14, "2 weeks"], [30, "1 month"], [60, "2 months"], [90, "3 months"], [180, "6 months"], [365, "1 year"]] as [number, string][]).map(([d, labelText]) => (
              <option key={d} value={d}>{labelText}</option>
            ))}
          </select>
        </div>

        <IntakeQuestionsEditor
          value={form.intakeQuestions}
          onChange={(intakeQuestions) => setForm((f) => f && ({ ...f, intakeQuestions }))}
        />

        <div>
          <label className={dashboardLabelClass}>Success redirect URL</label>
          <p className="text-xs text-muted-foreground mb-2">
            Optional. Send clients here after booking (https:// URL or path like /thank-you).
          </p>
          <input
            value={form.successRedirectUrl}
            onChange={(e) => setForm((f) => f && ({ ...f, successRedirectUrl: e.target.value }))}
            placeholder="https://example.com/thank-you or /thank-you"
            className={dashboardInputClass}
          />
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
            <label className={dashboardLabelClass}>Deposit percentage</label>
            <p className="text-xs text-muted-foreground mb-2">
              Use 0 for full payment, or collect a smaller deposit to reduce no-shows.
            </p>
            <input
              type="number"
              min={0}
              max={100}
              value={form.depositPercent}
              onChange={(e) => setForm((f) => f && ({ ...f, depositPercent: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
              className={dashboardInputClass}
            />
          </div>
        )}


        {error && <p className={dashboardErrorAlertClass}>{error}</p>}

        <div className="flex flex-wrap gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className={dashboardOutlineActionClass}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={cn(dashboardPrimaryActionClass, "ml-auto")}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>

      <DashboardSection
        title="Team members"
        description="Choose which staff members offer this service."
        className="max-w-lg"
      >
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
            type="button"
            onClick={handleSaveStaff}
            disabled={savingStaff}
            className={dashboardPrimaryActionClass}
          >
            {savingStaff ? "Saving…" : "Save team"}
          </button>
        )}
      </DashboardSection>

      <Dialog.Root
        open={forceDeactivateError !== null}
        onOpenChange={(open) => !open && setForceDeactivateError(null)}
      >
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/25" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 rounded-lg border bg-card border-border/60 p-5 shadow-xl">
            <Dialog.Title className="text-base font-semibold">Deactivate service</Dialog.Title>
            <Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">
              {forceDeactivateError}
            </Dialog.Description>
            <div className="mt-5 flex justify-end gap-2">
              <Dialog.Close className="rounded-md border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">
                Cancel
              </Dialog.Close>
              <button
                type="button"
                disabled={forcingDeactivate}
                onClick={() => void handleForceDeactivate()}
                className="rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {forcingDeactivate ? "Deactivating…" : "Deactivate anyway"}
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}
