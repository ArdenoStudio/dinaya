"use client";

import { useEffect, useState } from "react";
import { toast } from "@heroui/react";
import { ConfirmDialog } from "@/components/dashboard/ConfirmDialog";
import { DashboardCheckbox, DashboardTextField } from "@/components/dashboard/DashboardFormField";
import { Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { submitResource } from "@/lib/dashboard/use-resource";
import { dashboardErrorAlertClass, dashboardPrimaryActionClass } from "@/lib/dashboard-ui";

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
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
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
    const result = await submitResource("/api/dashboard/holidays", { date, name, isClosed }, "POST");
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDate("");
    setName("");
    setIsClosed(true);
    toast.success("Holiday added");
    await load();
  }

  async function removeHoliday(id: string) {
    const res = await fetch(`/api/dashboard/holidays?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (!res.ok) {
      toast.danger("Could not remove holiday");
      return;
    }
    toast.success("Holiday removed");
    await load();
  }

  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <h2 className="mb-1 font-cal text-lg tracking-tight">Business holidays</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Block public holidays or set special hours for the whole business.
      </p>

      <form onSubmit={addHoliday} className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <DashboardTextField label="Date" isRequired type="date" value={date} onChange={setDate} />
        <DashboardTextField label="Name" isRequired value={name} onChange={setName} placeholder="e.g. Public holiday" />
        <button type="submit" className={dashboardPrimaryActionClass}>
          Add holiday
        </button>
      </form>

      <div className="mb-4">
        <DashboardCheckbox isSelected={isClosed} onChange={setIsClosed} label="Closed all day" />
      </div>

      {error ? <p className={dashboardErrorAlertClass}>{error}</p> : null}

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
              <>
                <button
                  type="button"
                  className="text-muted-foreground hover:text-red-600"
                  aria-label="Remove holiday"
                  onClick={() => setConfirmRemoveId(holiday.id)}
                >
                  <Trash2 className="size-4" />
                </button>
                <ConfirmDialog
                  title="Remove holiday"
                  description={`Remove "${holiday.name}" (${holiday.date}) from your business holidays?`}
                  confirmLabel="Remove"
                  variant="destructive"
                  onConfirm={() => removeHoliday(holiday.id)}
                  open={confirmRemoveId === holiday.id}
                  onOpenChange={(open) => setConfirmRemoveId(open ? holiday.id : null)}
                />
              </>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
