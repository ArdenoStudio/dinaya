"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";

type Booking = {
  id: string;
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  startsAt: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  serviceName: string;
  staffName: string;
};

const STATUS_BG: Record<string, string> = {
  pending:   "bg-yellow-100 border-yellow-300 text-yellow-900",
  confirmed: "bg-green-100 border-green-300 text-green-900",
  cancelled: "bg-red-50 border-red-200 text-red-700 opacity-60",
  completed: "bg-blue-100 border-blue-300 text-blue-900",
  no_show:   "bg-gray-100 border-gray-300 text-gray-600 opacity-60",
};

// Hours to show: 7am–9pm
const START_HOUR = 7;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 56; // px per hour

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    setLoading(true);
    fetch("/api/dashboard/bookings?tab=all")
      .then((r) => r.json())
      .then((data) => { setBookings(data); setLoading(false); });
  }, []);

  function bookingsForDay(day: Date) {
    return bookings.filter((b) => isSameDay(new Date(b.startsAt), day));
  }

  function topPercent(startsAt: string): number {
    const d = new Date(startsAt);
    const hour = d.getHours() + d.getMinutes() / 60;
    return Math.max(0, ((hour - START_HOUR) / TOTAL_HOURS) * 100);
  }

  const today = new Date();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h1 className="font-cal text-2xl">Calendar</h1>
          <div className="flex gap-1">
            <button
              onClick={() => setWeekStart((w) => subWeeks(w, 1))}
              className="border px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            >
              ←
            </button>
            <button
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="border px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setWeekStart((w) => addWeeks(w, 1))}
              className="border px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
            >
              →
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            {format(weekStart, "d MMM")} – {format(addDays(weekStart, 6), "d MMM yyyy")}
          </span>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/bookings" className="border px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:border-primary/50 transition-colors">
            List view
          </Link>
          <Link href="/dashboard/bookings/new" className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90">
            + New booking
          </Link>
        </div>
      </div>

      {/* Grid */}
      <div className="bg-white border rounded-xl overflow-auto flex-1">
        {/* Day headers */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b sticky top-0 bg-white z-10">
          <div className="border-r" />
          {days.map((day) => {
            const isToday = isSameDay(day, today);
            return (
              <div key={day.toISOString()} className="border-r last:border-0 px-2 py-3 text-center">
                <p className="text-xs text-muted-foreground uppercase">{format(day, "EEE")}</p>
                <p className={`text-lg font-semibold mt-0.5 w-8 h-8 flex items-center justify-center rounded-full mx-auto ${isToday ? "bg-primary text-primary-foreground" : ""}`}>
                  {format(day, "d")}
                </p>
              </div>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-[48px_repeat(7,1fr)]">
          {/* Hour labels */}
          <div className="border-r">
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <div key={i} style={{ height: HOUR_HEIGHT }} className="border-b flex items-start justify-end pr-2 pt-1">
                <span className="text-xs text-muted-foreground">
                  {format(new Date().setHours(START_HOUR + i, 0, 0, 0), "h a")}
                </span>
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dayBookings = bookingsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className="border-r last:border-0 relative"
                style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
              >
                {/* Hour lines */}
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-b border-muted/40"
                    style={{ top: i * HOUR_HEIGHT }}
                  />
                ))}

                {/* Current time line */}
                {isSameDay(day, today) && (() => {
                  const now = new Date();
                  const pct = topPercent(now.toISOString());
                  if (pct < 0 || pct > 100) return null;
                  return (
                    <div
                      className="absolute w-full z-10 flex items-center"
                      style={{ top: `${pct}%` }}
                    >
                      <div className="w-2 h-2 rounded-full bg-primary -ml-1" />
                      <div className="flex-1 h-px bg-primary" />
                    </div>
                  );
                })()}

                {/* Booking blocks */}
                {loading ? null : dayBookings.map((b) => {
                  const top = topPercent(b.startsAt);
                  return (
                    <Link
                      key={b.id}
                      href={`/dashboard/bookings/${b.id}`}
                      className={`absolute left-1 right-1 rounded border text-xs px-1.5 py-1 overflow-hidden hover:opacity-80 transition-opacity z-20 ${STATUS_BG[b.status]}`}
                      style={{ top: `${top}%`, minHeight: 24 }}
                      title={`${b.clientName} · ${b.serviceName}`}
                    >
                      <p className="font-medium truncate">{b.clientName}</p>
                      <p className="truncate opacity-75">{b.serviceName}</p>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
