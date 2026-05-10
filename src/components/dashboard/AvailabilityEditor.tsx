"use client";

import { useState, useEffect } from "react";
import type { Staff } from "@/db/schema";

interface AvailRow {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
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

export default function AvailabilityEditor({ staffList, dayNames }: Props) {
  const [selectedStaffId, setSelectedStaffId] = useState(staffList[0]?.id ?? "");
  const [rows, setRows] = useState<AvailRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!selectedStaffId) return;
    setLoading(true);
    fetch(`/api/dashboard/availability?staffId=${selectedStaffId}`)
      .then((r) => r.json())
      .then((d) => { setRows(d.length ? d : DEFAULT_HOURS); setLoading(false); });
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

  return (
    <div className="bg-white border rounded-xl p-6">
      {/* Staff picker */}
      <div className="mb-5">
        <label className="text-sm font-medium">Team member</label>
        <select value={selectedStaffId} onChange={(e) => setSelectedStaffId(e.target.value)}
          className="mt-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary">
          {staffList.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

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
          {saving ? "Saving…" : "Save availability"}
        </button>
        {saved && <span className="text-green-600 text-sm">Saved ✓</span>}
      </div>
    </div>
  );
}
