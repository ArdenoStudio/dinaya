"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/skeleton";
import { dashboardInputClass, dashboardPrimaryActionClass } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

type Holiday = {
  id: string;
  date: string;
  name: string;
  isClosed: boolean;
  startTime: string | null;
  endTime: string | null;
};

export default function HolidaysEditor() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [isClosed, setIsClosed] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const res = await fetch("/api/dashboard/holidays");
    const data = await res.json();
    setHolidays(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function addHoliday(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/dashboard/holidays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, name, isClosed }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not add holiday.");
      return;
    }
    setDate("");
    setName("");
    setIsClosed(true);
    await load();
  }

  async function removeHoliday(id: string) {
    await fetch(`/api/dashboard/holidays?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <h2 className="mb-1 font-cal text-lg tracking-tight">Business holidays</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Block public holidays or set special hours for the whole business.
      </p>

      <form onSubmit={addHoliday} className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={cn(dashboardInputClass, "mt-0")}
        />
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Public holiday"
          className={cn(dashboardInputClass, "mt-0")}
        />
        <button type="submit" className={dashboardPrimaryActionClass}>
          Add holiday
        </button>
      </form>

      <label className="mb-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={isClosed}
          onChange={(e) => setIsClosed(e.target.checked)}
        />
        Closed all day
      </label>

      {error ? <p className="mb-3 text-sm text-red-600">{error}</p> : null}

      {loading ? (
        <div className="space-y-2" aria-busy="true" aria-live="polite" role="status">
          <span className="sr-only">Loading holidays</span>
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-11 w-full rounded-lg" />
          ))}
        </div>
      ) : holidays.length === 0 ? (
        <p className="text-sm text-muted-foreground">No holidays added yet.</p>
      ) : (
        <ul className="space-y-2">
          {holidays.map((holiday) => (
            <li
              key={holiday.id}
              className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
            >
              <div>
                <span className="font-medium">{holiday.name}</span>
                <span className="ml-2 text-muted-foreground">{holiday.date}</span>
                {!holiday.isClosed && holiday.startTime && holiday.endTime ? (
                  <span className="ml-2 text-muted-foreground">
                    {holiday.startTime}–{holiday.endTime}
                  </span>
                ) : null}
              </div>
              <ConfirmDialog
                title="Remove holiday"
                description={`Remove "${holiday.name}" (${holiday.date}) from your business holidays?`}
                confirmLabel="Remove"
                onConfirm={() => removeHoliday(holiday.id)}
                trigger={
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-red-600"
                    aria-label="Remove holiday"
                  >
                    <Icon name="trash" className="text-sm" />
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
