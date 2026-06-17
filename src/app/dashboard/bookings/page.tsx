"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { CalendarPlus, Download } from "lucide-react";
import { bookingReminderText, whatsappUrl } from "@/lib/whatsapp";
import { DataTable } from "@/components/dashboard/DataTable";
import { EmptyState } from "@/components/dashboard/EmptyState";

type Booking = {
  id: string;
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  amountLkr: number | null;
  paymentStatus: "pending" | "success" | "failed" | "refunded" | null;
  source: string;
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
  no_show: "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400",
};

const TABS = [
  { key: "upcoming", label: "Upcoming" },
  { key: "past", label: "Past" },
  { key: "cancelled", label: "Cancelled" },
  { key: "all", label: "All" },
] as const;

type Tab = (typeof TABS)[number]["key"];

const ACTIONS: Record<string, { label: string; next: string; style: string }[]> = {
  pending: [
    { label: "Confirm", next: "confirmed", style: "text-green-700 hover:bg-green-50 border-green-200" },
    { label: "Cancel", next: "cancelled", style: "text-red-600 hover:bg-red-50 border-red-200" },
  ],
  confirmed: [
    { label: "Complete", next: "completed", style: "text-blue-700 hover:bg-blue-50 dark:bg-blue-950/40 border-blue-200" },
    { label: "No-show", next: "no_show", style: "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:bg-neutral-900/60 border-gray-200 dark:border-neutral-800" },
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
      .then((data) => {
        setRows(data);
        setLoading(false);
      });
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
        prev.map((b) => (b.id === bookingId ? { ...b, status: updated.status } : b)),
      );
    }
    setUpdating(null);
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-cal text-2xl">Bookings</h1>
        <div className="flex gap-2">
          <a
            href={`/api/dashboard/bookings?tab=${tab}&export=csv`}
            className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            <Download className="size-3.5" aria-hidden="true" />
            Export CSV
          </a>
          <Link
            href="/dashboard/calendar"
            className="flex items-center gap-1.5 rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
          >
            Calendar
          </Link>
          <Link
            href="/dashboard/bookings/new"
            className="flex items-center gap-1.5 rounded-md border-b-2 border-primary/70 bg-gradient-to-b from-primary/90 to-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-all hover:shadow-md hover:shadow-primary/30"
          >
            + New booking
          </Link>
        </div>
      </div>

      <div className="mb-5 flex gap-1 border-b" role="tablist" aria-label="Booking filters">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={tab === t.key}
            onClick={() => setTab(t.key)}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
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
        <div className="rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-12 text-center text-sm text-muted-foreground">
          Loading…
        </div>
      ) : (
        <DataTable
          rows={rows}
          getRowId={(row) => row.id}
          empty={
            <EmptyState
              icon={CalendarPlus}
              title="No bookings here yet"
              description="New bookings from your booking page or manual entries will appear here."
              action={
                <Link
                  href="/dashboard/bookings/new"
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Create booking
                </Link>
              }
            />
          }
          columns={[
            {
              key: "client",
              header: "Client",
              render: (row) => (
                <>
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
                </>
              ),
            },
            { key: "service", header: "Service", render: (row) => row.serviceName },
            { key: "staff", header: "Staff", render: (row) => row.staffName },
            {
              key: "datetime",
              header: "Date & Time",
              render: (row) => (
                <>
                  <p>{format(new Date(row.startsAt), "d MMM yyyy")}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(new Date(row.startsAt), "h:mm a")}
                  </p>
                </>
              ),
            },
            {
              key: "status",
              header: "Status",
              render: (row) => (
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[row.status] ?? ""}`}
                >
                  {row.status.replace("_", " ")}
                </span>
              ),
            },
            {
              key: "payment",
              header: "Payment",
              render: (row) => (
                <>
                  <p className="tabular-nums">
                    {row.amountLkr ? `LKR ${row.amountLkr.toLocaleString()}` : "-"}
                  </p>
                  {row.paymentStatus ? (
                    <p className="text-xs capitalize text-muted-foreground">{row.paymentStatus}</p>
                  ) : null}
                </>
              ),
            },
            {
              key: "source",
              header: "Source",
              className: "text-muted-foreground",
              render: (row) => <span className="text-xs capitalize">{row.source}</span>,
            },
            {
              key: "actions",
              header: "",
              align: "right",
              render: (row) => {
                const actions = ACTIONS[row.status] ?? [];
                const isUpdating = updating === row.id;
                return (
                  <div className="flex items-center justify-end gap-1.5">
                    <Link
                      href={`/dashboard/bookings/${row.id}`}
                      className="rounded border border-gray-200 dark:border-neutral-800 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/50"
                    >
                      View
                    </Link>
                    <a
                      href={whatsappUrl(
                        row.clientPhone,
                        bookingReminderText({
                          clientName: row.clientName,
                          serviceName: row.serviceName,
                          startsAt: row.startsAt,
                        }),
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded border border-green-200 px-2.5 py-1 text-xs font-medium text-green-700 transition-colors hover:bg-green-50"
                      title="Message on WhatsApp"
                    >
                      WhatsApp
                    </a>
                    {actions.map((a) => (
                      <button
                        key={a.next}
                        type="button"
                        disabled={isUpdating}
                        onClick={() => updateStatus(row.id, a.next)}
                        className={`rounded border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-40 ${a.style}`}
                      >
                        {isUpdating ? "…" : a.label}
                      </button>
                    ))}
                  </div>
                );
              },
            },
          ]}
        />
      )}
    </div>
  );
}
