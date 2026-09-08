"use client";

import { useState, useEffect } from "react";
import { toast } from "@heroui/react";
import type { Staff } from "@/db/schema";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { DashboardCheckbox, DashboardSelect, DashboardTextField } from "@/components/dashboard/DashboardFormField";
import { Skeleton } from "@/components/ui/skeleton";
import { submitResource } from "@/lib/dashboard/use-resource";
import { dashboardErrorAlertClass, dashboardPrimaryActionClass } from "@/lib/dashboard-ui";

interface AvailRow {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Override {
  id: string;
  date: string;
  isBlocked: boolean;
  startTime: string | null;
  endTime: string | null;
  reason: string | null;
}

interface Props {
  staffList: Staff[];
  dayNames: string[];
}

const DEFAULT_HOURS: AvailRow[] = [1, 2, 3, 4, 5].map((d) => ({
  dayOfWeek: d,
  startTime: "09:00",
  endTime: "17:00",
}));

const OVERRIDE_TYPE_OPTIONS = [
  { value: "blocked", label: "Full day off" },
  { value: "custom", label: "Custom hours" },
];

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function AvailabilityEditor({ staffList, dayNames }: Props) {
  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id ?? "");
  const [rows, setRows] = useState<AvailRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Overrides state
  const [overrides, setOverrides] = useState<Override[]>([]);
  const [overridesLoading, setOverridesLoading] = useState(false);
  const [newOverride, setNewOverride] = useState({
    date: today(),
    isBlocked: true,
    startTime: "09:00",
    endTime: "17:00",
    reason: "",
  });
  const [addingOverride, setAddingOverride] = useState(false);

  useEffect(() => {
    if (!selectedStaffId) return;
    setLoading(true);
    setOverridesLoading(true);

    fetch(`/api/dashboard/availability?staffId=${selectedStaffId}`)
      .then((r) => r.json())
      .then((d) => { setRows(d.length ? d : DEFAULT_HOURS); setLoading(false); });

    fetch(`/api/dashboard/availability/overrides?staffId=${selectedStaffId}`)
      .then((r) => r.json())
      .then((d) => { setOverrides(Array.isArray(d) ? d : []); setOverridesLoading(false); });
  }, [selectedStaffId]);

  function toggleDay(day: number) {
    if (rows.some((r) => r.dayOfWeek === day)) {
      setRows((rs) => rs.filter((r) => r.dayOfWeek !== day));
    } else {
      setRows((rs) => [...rs, { dayOfWeek: day, startTime: "09:00", endTime: "17:00" }].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
    }
  }

  function updateRow(index: number, field: "startTime" | "endTime", value: string) {
    setRows((rs) => rs.map((r, i) => i === index ? { ...r, [field]: value } : r));
  }

  function addBlock(day: number) {
    setRows((rs) => [...rs, { dayOfWeek: day, startTime: "13:00", endTime: "17:00" }].sort((a, b) =>
      a.dayOfWeek === b.dayOfWeek ? a.startTime.localeCompare(b.startTime) : a.dayOfWeek - b.dayOfWeek
    ));
  }

  function removeBlock(index: number) {
    setRows((rs) => rs.filter((_, i) => i !== index));
  }

  function validateRows(): string | null {
    for (const row of rows) {
      if (row.startTime >= row.endTime) {
        return `${dayNames[row.dayOfWeek]} has a block that ends before it starts.`;
      }
    }

    for (const day of [0, 1, 2, 3, 4, 5, 6]) {
      const dayRows = rows
        .filter((row) => row.dayOfWeek === day)
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      for (let i = 1; i < dayRows.length; i++) {
        if (dayRows[i - 1].endTime > dayRows[i].startTime) {
          return `${dayNames[day]} has overlapping availability blocks.`;
        }
      }
    }

    return null;
  }

  async function handleSave() {
    const validationError = validateRows();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setSaving(true);
    const result = await submitResource("/api/dashboard/availability", { staffId: selectedStaffId, rows }, "POST");
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    toast.success("Schedule saved");
  }

  async function handleAddOverride() {
    setAddingOverride(true);
    const body = {
      staffId: selectedStaffId,
      date: newOverride.date,
      isBlocked: newOverride.isBlocked,
      startTime: newOverride.isBlocked ? null : newOverride.startTime,
      endTime: newOverride.isBlocked ? null : newOverride.endTime,
      reason: newOverride.reason || null,
    };
    const result = await submitResource("/api/dashboard/availability/overrides", body, "POST");
    setAddingOverride(false);
    if (!result.ok) {
      toast.danger("Could not add override", { description: result.error });
      return;
    }
    const row = result.data as Override;
    setOverrides((prev) => {
      const without = prev.filter((o) => o.date !== row.date);
      return [...without, row].sort((a, b) => a.date.localeCompare(b.date));
    });
    toast.success("Override added");
  }

  async function handleDeleteOverride(id: string) {
    const res = await fetch(`/api/dashboard/availability/overrides?id=${id}&staffId=${selectedStaffId}`, { method: "DELETE" });
    if (!res.ok) {
      toast.danger("Could not remove override");
      return;
    }
    setOverrides((prev) => prev.filter((o) => o.id !== id));
    toast.success("Override removed");
  }

  return (
    <div className="space-y-6">
      {/* Staff picker */}
      <div className="rounded-2xl border border-border/60 bg-card dark:border-border/60 dark:bg-card p-6">
        <DashboardSelect
          label="Team member"
          value={selectedStaffId}
          onChange={setSelectedStaffId}
          options={staffList.map((s) => ({ value: s.id, label: s.name }))}
        />
      </div>

      {/* Weekly schedule */}
      <div className="rounded-2xl border border-border/60 bg-card dark:border-border/60 dark:bg-card p-6">
        <h2 className="font-cal text-lg tracking-tight mb-4">Weekly schedule</h2>
        {loading ? (
          <div className="space-y-3" aria-busy="true" aria-live="polite" role="status">
            <span className="sr-only">Loading weekly schedule</span>
            {dayNames.map((name) => (
              <div key={name} className="flex items-center gap-3 rounded-xl border border-border/50 px-3 py-2.5">
                <Skeleton className="size-4 shrink-0 rounded" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="ml-auto h-8 w-24 rounded-lg" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {dayNames.map((name, day) => {
              const dayRows = rows
                .map((row, index) => ({ ...row, index }))
                .filter((r) => r.dayOfWeek === day)
                .sort((a, b) => a.startTime.localeCompare(b.startTime));
              const active = dayRows.length > 0;
              return (
                <div key={day} className="items-start gap-3 rounded-lg border border-transparent py-2 sm:flex">
                  <div className="w-28 shrink-0">
                    <DashboardCheckbox isSelected={active} onChange={() => toggleDay(day)} label={name} />
                  </div>
                  {active && (
                    <div className="mt-2 flex-1 space-y-2 sm:mt-0">
                      {dayRows.map((row) => (
                        <div key={row.index} className="flex items-center gap-2">
                          <input type="time" value={row.startTime} onChange={(e) => updateRow(row.index, "startTime", e.target.value)}
                            className="border rounded-md px-2 py-1 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary" />
                          <span className="text-muted-foreground text-sm">to</span>
                          <input type="time" value={row.endTime} onChange={(e) => updateRow(row.index, "endTime", e.target.value)}
                            className="border rounded-md px-2 py-1 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary" />
                          {dayRows.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeBlock(row.index)}
                              className="rounded border px-2 py-1 text-xs text-muted-foreground hover:text-destructive"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => addBlock(day)}
                        className="text-xs font-medium text-primary hover:underline"
                      >
                        Add split shift
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        {error && <p className={dashboardErrorAlertClass}>{error}</p>}
        <div className="mt-5">
          <button onClick={handleSave} disabled={saving} className={dashboardPrimaryActionClass}>
            {saving ? "Saving…" : "Save schedule"}
          </button>
        </div>
      </div>

      {/* Date overrides */}
      <div className="rounded-2xl border border-border/60 bg-card dark:border-border/60 dark:bg-card p-6">
        <h2 className="font-cal text-lg tracking-tight mb-1">Date overrides</h2>
        <p className="text-xs text-muted-foreground mb-4">Block a holiday or set custom hours for a specific date.</p>

        {/* Add override form */}
        <div className="border rounded-lg p-4 mb-4 space-y-3 bg-muted/20">
          <div className="grid grid-cols-2 gap-3">
            <DashboardTextField
              label="Date"
              type="date"
              value={newOverride.date}
              onChange={(value) => setNewOverride((f) => ({ ...f, date: value }))}
            />
            <DashboardSelect
              label="Type"
              value={newOverride.isBlocked ? "blocked" : "custom"}
              onChange={(value) => setNewOverride((f) => ({ ...f, isBlocked: value === "blocked" }))}
              options={OVERRIDE_TYPE_OPTIONS}
            />
          </div>

          {!newOverride.isBlocked && (
            <div className="grid grid-cols-2 gap-3">
              <DashboardTextField
                label="From"
                type="time"
                value={newOverride.startTime}
                onChange={(value) => setNewOverride((f) => ({ ...f, startTime: value }))}
              />
              <DashboardTextField
                label="To"
                type="time"
                value={newOverride.endTime}
                onChange={(value) => setNewOverride((f) => ({ ...f, endTime: value }))}
              />
            </div>
          )}

          <DashboardTextField
            label="Reason (optional)"
            value={newOverride.reason}
            onChange={(value) => setNewOverride((f) => ({ ...f, reason: value }))}
            placeholder="e.g. Public holiday"
          />

          <button
            onClick={handleAddOverride}
            disabled={addingOverride || !newOverride.date}
            className={dashboardPrimaryActionClass}
          >
            {addingOverride ? "Adding…" : "Add override"}
          </button>
        </div>

        {/* Existing overrides list */}
        {overridesLoading ? (
          <div className="space-y-2" aria-busy="true" aria-live="polite" role="status">
            <span className="sr-only">Loading date overrides</span>
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-11 w-full rounded-lg" />
            ))}
          </div>
        ) : overrides.length === 0 ? (
          <p className="text-muted-foreground text-sm">No date overrides set.</p>
        ) : (
          <div className="space-y-2">
            {overrides.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 px-3 border rounded-lg">
                <div>
                  <span className="text-sm font-medium">{o.date}</span>
                  {o.isBlocked ? (
                    <span className="ml-2 text-xs bg-red-100 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">Day off</span>
                  ) : (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {o.startTime?.slice(0, 5)} – {o.endTime?.slice(0, 5)}
                    </span>
                  )}
                  {o.reason && <span className="ml-2 text-xs text-muted-foreground">{o.reason}</span>}
                </div>
                <>
                  <button
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={() => setConfirmRemoveId(o.id)}
                  >
                    Remove
                  </button>
                  <ConfirmDialog
                    title="Remove date override"
                    description={`Remove the override for ${o.date}? Availability will fall back to the regular weekly schedule.`}
                    confirmLabel="Remove"
                    variant="destructive"
                    onConfirm={() => handleDeleteOverride(o.id)}
                    open={confirmRemoveId === o.id}
                    onOpenChange={(open) => setConfirmRemoveId(open ? o.id : null)}
                  />
                </>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
