"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/ui/Icon";

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
    <div className="rounded-xl border bg-white p-5">
      <h2 className="mb-1 font-semibold">Business holidays</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Block public holidays or set special hours for the whole business.
      </p>

      <form onSubmit={addHoliday} className="mb-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Public holiday"
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
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
        <p className="text-sm text-muted-foreground">Loading holidays…</p>
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
              <button
                type="button"
                onClick={() => removeHoliday(holiday.id)}
                className="text-muted-foreground hover:text-red-600"
                aria-label="Remove holiday"
              >
                <Icon name="trash" className="text-sm" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
