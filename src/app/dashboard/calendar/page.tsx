"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isSameDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";

type StaffMember = {
  id: string;
  name: string;
};

type Booking = {
  id: string;
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  endsAt: string;
  staffId: string;
  startsAt: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  serviceName: string;
  staffName: string;
};

const STATUS_BG: Record<string, string> = {
  pending: "bg-yellow-100 border-yellow-300 text-yellow-900",
  confirmed: "bg-green-100 border-green-300 text-green-900",
  cancelled: "bg-red-50 border-red-200 text-red-700 opacity-60",
  completed: "bg-blue-100 border-blue-300 text-blue-900",
  no_show: "bg-gray-100 border-gray-300 text-gray-600 opacity-60",
};

const START_HOUR = 7;
const END_HOUR = 21;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const HOUR_HEIGHT = 56;

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 }),
  );
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [loading, setLoading] = useState(true);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  useEffect(() => {
    setLoading(true);
    const from = weekStart.toISOString();
    const to = addDays(weekStart, 7).toISOString();
    const staffParam = selectedStaffId
      ? `&staffIds=${encodeURIComponent(selectedStaffId)}`
      : "";
    fetch(`/api/calendar?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}${staffParam}`)
      .then((r) => r.json())
      .then((data) => {
        setBookings(data.bookings ?? []);
        if (data.staff?.length) {
          setStaffMembers(data.staff);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [weekStart, selectedStaffId]);

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
    <div className="flex h-full flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-cal text-2xl">Calendar</h1>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setWeekStart((w) => subWeeks(w, 1))}
              aria-label="Previous week"
              className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setWeekStart((w) => addWeeks(w, 1))}
              aria-label="Next week"
              className="rounded-md border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </div>
          <span className="text-sm text-muted-foreground">
            {format(weekStart, "d MMM")} – {format(addDays(weekStart, 6), "d MMM yyyy")}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {staffMembers.length > 1 ? (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="sr-only">Filter by staff</span>
              <select
                value={selectedStaffId}
                onChange={(e) => setSelectedStaffId(e.target.value)}
                aria-label="Filter by staff member"
                className="rounded-md border bg-white px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30"
              >
                <option value="">All staff</option>
                {staffMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          <Link
            href="/dashboard/bookings"
            className="rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50"
          >
            List view
          </Link>
          <Link
            href="/dashboard/bookings/new"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            + New booking
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-auto rounded-xl border bg-white">
        <div className="sticky top-0 z-10 grid grid-cols-[48px_repeat(7,1fr)] border-b bg-white">
          <div className="border-r" />
          {days.map((day) => {
            const isToday = isSameDay(day, today);
            return (
              <div key={day.toISOString()} className="border-r px-2 py-3 text-center last:border-0">
                <p className="text-xs uppercase text-muted-foreground">{format(day, "EEE")}</p>
                <p
                  className={`mx-auto mt-0.5 flex h-8 w-8 items-center justify-center rounded-full text-lg font-semibold ${isToday ? "bg-primary text-primary-foreground" : ""}`}
                >
                  {format(day, "d")}
                </p>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-[48px_repeat(7,1fr)]">
          <div className="border-r">
            {Array.from({ length: TOTAL_HOURS }, (_, i) => (
              <div
                key={i}
                style={{ height: HOUR_HEIGHT }}
                className="flex items-start justify-end border-b pr-2 pt-1"
              >
                <span className="text-xs text-muted-foreground">
                  {format(new Date().setHours(START_HOUR + i, 0, 0, 0), "h a")}
                </span>
              </div>
            ))}
          </div>

          {days.map((day) => {
            const dayBookings = bookingsForDay(day);
            return (
              <div
                key={day.toISOString()}
                className="relative border-r last:border-0"
                style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
              >
                {Array.from({ length: TOTAL_HOURS }, (_, i) => (
                  <div
                    key={i}
                    className="absolute w-full border-b border-muted/40"
                    style={{ top: i * HOUR_HEIGHT }}
                  />
                ))}

                {isSameDay(day, today)
                  ? (() => {
                      const pct = topPercent(new Date().toISOString());
                      if (pct < 0 || pct > 100) return null;
                      return (
                        <div
                          className="absolute z-10 flex w-full items-center"
                          style={{ top: `${pct}%` }}
                        >
                          <div className="-ml-1 h-2 w-2 rounded-full bg-primary" />
                          <div className="h-px flex-1 bg-primary" />
                        </div>
                      );
                    })()
                  : null}

                {loading
                  ? null
                  : dayBookings.map((b) => {
                      const top = topPercent(b.startsAt);
                      return (
                        <Link
                          key={b.id}
                          href={`/dashboard/bookings/${b.id}`}
                          className={`absolute left-1 right-1 z-20 overflow-hidden rounded border px-1.5 py-1 text-xs transition-opacity hover:opacity-80 ${STATUS_BG[b.status]}`}
                          style={{ top: `${top}%`, minHeight: 24 }}
                          title={`${b.clientName} · ${b.serviceName}`}
                        >
                          <p className="truncate font-medium">{b.clientName}</p>
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
