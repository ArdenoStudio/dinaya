"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";

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

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  no_show: "bg-gray-100 text-gray-600",
};

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
] as const;

type Tab = (typeof TABS)[number]["key"];

// Actions available per status
const ACTIONS: Record<string, { label: string; next: string; style: string }[]> = {
  pending: [
    { label: "Confirm", next: "confirmed", style: "text-green-700 hover:bg-green-50 border-green-200" },
    { label: "Cancel", next: "cancelled", style: "text-red-600 hover:bg-red-50 border-red-200" },
  ],
  confirmed: [
    { label: "Complete", next: "completed", style: "text-blue-700 hover:bg-blue-50 border-blue-200" },
    { label: "No-show", next: "no_show", style: "text-gray-600 hover:bg-gray-50 border-gray-200" },
    { label: "Cancel", next: "cancelled", style: "text-red-600 hover:bg-red-50 border-red-200" },
  ],
};

export default function BookingsPage() {
  const [tab, setTab] = useState<Tab>("upcoming");
  const [rows, setRows] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/dashboard/bookings?tab=${tab}`)
      .then((r) => r.json())
      .then((data) => { setRows(data); setLoading(false); });
  }, [tab]);

  async function updateStatus(bookingId: string, status: string) {
    setUpdating(bookingId);
    const res = await fetch(`/api/dashboard/bookings/${bookingId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setRows((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: updated.status } : b))
      );
    }
    setUpdating(null);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-cal text-2xl">Bookings</h1>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 border-b">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white border rounded-xl p-12 text-center text-muted-foreground text-sm">
          Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white border rounded-xl p-12 text-center text-muted-foreground">
          No bookings here yet.
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Service</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Staff</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date & Time</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const actions = ACTIONS[row.status] ?? [];
                const isUpdating = updating === row.id;
                return (
                  <tr key={row.id} className={`border-b last:border-0 ${i % 2 === 1 ? "bg-muted/10" : ""}`}>
                    <td className="px-4 py-3">
                      {row.clientId ? (
                        <Link
                          href={`/dashboard/clients/${row.clientId}`}
                          className="font-medium hover:text-primary hover:underline"
                        >
                          {row.clientName}
                        </Link>
                      ) : (
                        <p className="font-medium">{row.clientName}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{row.clientPhone}</p>
                    </td>
                    <td className="px-4 py-3">{row.serviceName}</td>
                    <td className="px-4 py-3">{row.staffName}</td>
                    <td className="px-4 py-3">
                      <p>{format(new Date(row.startsAt), "d MMM yyyy")}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(row.startsAt), "h:mm a")}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[row.status] ?? ""}`}>
                        {row.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {actions.length > 0 && (
                        <div className="flex gap-1.5 justify-end">
                          {actions.map((a) => (
                            <button
                              key={a.next}
                              disabled={isUpdating}
                              onClick={() => updateStatus(row.id, a.next)}
                              className={`text-xs px-2.5 py-1 rounded border font-medium transition-colors disabled:opacity-40 ${a.style}`}
                            >
                              {isUpdating ? "…" : a.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
