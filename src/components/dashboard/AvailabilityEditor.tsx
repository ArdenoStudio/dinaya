"use client";

import { useState, useEffect } from "react";
import type { Staff } from "@/db/schema";

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

function today() {
  return new Date().toISOString().split("T")[0];
}

export default function AvailabilityEditor({ staffList, dayNames }: Props) {
  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id ?? "");
  const [rows, setRows] = useState<AvailRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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
    if (rows.find((r) => r.dayOfWeek === day)) {
      setRows((rs) => rs.filter((r) => r.dayOfWeek !== day));
    } else {
      setRows((rs) => [...rs, { dayOfWeek: day, startTime: "09:00", endTime: "17:00" }].sort((a, b) => a.dayOfWeek - b.dayOfWeek));
    }
  }

  function updateRow(day: number, field: "startTime" | "endTime", value: string) {
    setRows((rs) => rs.map((r) => r.dayOfWeek === day ? { ...r, [field]: value } : r));
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/dashboard/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId: selectedStaffId, rows }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
    const res = await fetch("/api/dashboard/availability/overrides", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      const row = await res.json();
      setOverrides((prev) => {
        const without = prev.filter((o) => o.date !== row.date);
        return [...without, row].sort((a, b) => a.date.localeCompare(b.date));
      });
    }
    setAddingOverride(false);
  }

  async function handleDeleteOverride(id: string) {
    await fetch(`/api/dashboard/availability/overrides?id=${id}&staffId=${selectedStaffId}`, { method: "DELETE" });
    setOverrides((prev) => prev.filter((o) => o.id !== id));
  }

  return (
    <div className="space-y-6">
      {/* Staff picker */}
      <div className="bg-white border rounded-xl p-6">
        <label className="text-sm font-medium">Team member</label>
        <select
          value={selectedStaffId}
          onChange={(e) => setSelectedStaffId(e.target.value)}
          className="mt-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {/* Weekly schedule */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-medium mb-4">Weekly schedule</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : (
          <div className="space-y-3">
            {dayNames.map((name, day) => {
              const row = rows.find((r) => r.dayOfWeek === day);
              const active = !!row;
              return (
                <div key={day} className="flex items-center gap-3">
                  <label className="flex items-center gap-2 w-28 cursor-pointer">
                    <input type="checkbox" checked={active} onChange={() => toggleDay(day)} className="rounded" />
                    <span className={`text-sm ${active ? "font-medium" : "text-muted-foreground"}`}>{name}</span>
                  </label>
                  {active && (
                    <>
                      <input type="time" value={row.startTime} onChange={(e) => updateRow(day, "startTime", e.target.value)}
                        className="border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                      <span className="text-muted-foreground text-sm">to</span>
                      <input type="time" value={row.endTime} onChange={(e) => updateRow(day, "endTime", e.target.value)}
                        className="border rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
        <div className="mt-5 flex items-center gap-3">
          <button onClick={handleSave} disabled={saving}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Saving…" : "Save schedule"}
          </button>
          {saved && <span className="text-green-600 text-sm">Saved ✓</span>}
        </div>
      </div>

      {/* Date overrides */}
      <div className="bg-white border rounded-xl p-6">
        <h2 className="font-medium mb-1">Date overrides</h2>
        <p className="text-xs text-muted-foreground mb-4">Block a holiday or set custom hours for a specific date.</p>

        {/* Add override form */}
        <div className="border rounded-lg p-4 mb-4 space-y-3 bg-muted/20">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground">Date</label>
              <input
                type="date"
                value={newOverride.date}
                min={today()}
                onChange={(e) => setNewOverride((f) => ({ ...f, date: e.target.value }))}
                className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Type</label>
              <select
                value={newOverride.isBlocked ? "blocked" : "custom"}
                onChange={(e) => setNewOverride((f) => ({ ...f, isBlocked: e.target.value === "blocked" }))}
                className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="blocked">Full day off</option>
                <option value="custom">Custom hours</option>
              </select>
            </div>
          </div>

          {!newOverride.isBlocked && (
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">From</label>
                <input type="time" value={newOverride.startTime}
                  onChange={(e) => setNewOverride((f) => ({ ...f, startTime: e.target.value }))}
                  className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground">To</label>
                <input type="time" value={newOverride.endTime}
                  onChange={(e) => setNewOverride((f) => ({ ...f, endTime: e.target.value }))}
                  className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs text-muted-foreground">Reason (optional)</label>
            <input
              type="text"
              value={newOverride.reason}
              onChange={(e) => setNewOverride((f) => ({ ...f, reason: e.target.value }))}
              placeholder="e.g. Public holiday"
              className="mt-1 w-full border rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            onClick={handleAddOverride}
            disabled={addingOverride || !newOverride.date}
            className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {addingOverride ? "Adding…" : "Add override"}
          </button>
        </div>

        {/* Existing overrides list */}
        {overridesLoading ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : overrides.length === 0 ? (
          <p className="text-muted-foreground text-sm">No date overrides set.</p>
        ) : (
          <div className="space-y-2">
            {overrides.map((o) => (
              <div key={o.id} className="flex items-center justify-between py-2 px-3 border rounded-lg">
                <div>
                  <span className="text-sm font-medium">{o.date}</span>
                  {o.isBlocked ? (
                    <span className="ml-2 text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Day off</span>
                  ) : (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                      {o.startTime?.slice(0, 5)} – {o.endTime?.slice(0, 5)}
                    </span>
                  )}
                  {o.reason && <span className="ml-2 text-xs text-muted-foreground">{o.reason}</span>}
                </div>
                <button
                  onClick={() => handleDeleteOverride(o.id)}
                  className="text-xs text-muted-foreground hover:text-destructive"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
