"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { bookingReminderText, whatsappUrl } from "@/lib/whatsapp";

type Booking = {
  id: string;
  clientId: string | null;
  clientName: string;
  clientPhone: string;
  clientEmail: string | null;
  startsAt: string;
  endsAt: string;
  status: "pending" | "confirmed" | "cancelled" | "completed" | "no_show";
  notes: string | null;
  staffNotes: string | null;
  serviceName: string;
  serviceDuration: number;
  staffName: string;
  clientStage: string | null;
  createdAt: string;
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
  no_show: "bg-gray-100 text-gray-600",
};

const ACTIONS: Record<string, { label: string; next: string; style: string }[]> = {
  pending: [
    { label: "Confirm", next: "confirmed", style: "bg-gradient-to-b from-green-500 to-green-600 border-b-2 border-green-700 text-white shadow-sm hover:shadow-green-300/40 hover:shadow-md" },
    { label: "Cancel", next: "cancelled", style: "bg-gradient-to-b from-red-400 to-red-500 border-b-2 border-red-600 text-white shadow-sm hover:shadow-red-300/40 hover:shadow-md" },
  ],
  confirmed: [
    { label: "Mark complete", next: "completed", style: "bg-gradient-to-b from-blue-500 to-blue-600 border-b-2 border-blue-700 text-white shadow-sm hover:shadow-blue-300/40 hover:shadow-md" },
    { label: "No-show", next: "no_show", style: "bg-gradient-to-b from-gray-400 to-gray-500 border-b-2 border-gray-600 text-white shadow-sm" },
    { label: "Cancel", next: "cancelled", style: "bg-gradient-to-b from-red-400 to-red-500 border-b-2 border-red-600 text-white shadow-sm hover:shadow-red-300/40 hover:shadow-md" },
  ],
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffNotes, setStaffNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetch(`/api/dashboard/bookings/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setBooking(data);
        setStaffNotes(data.staffNotes ?? "");
        setLoading(false);
      });
  }, [id]);

  async function updateStatus(status: string) {
    setUpdatingStatus(true);
    const res = await fetch(`/api/dashboard/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setBooking((b) => b ? { ...b, status: updated.status } : b);
    }
    setUpdatingStatus(false);
  }

  async function saveNotes() {
    setSavingNotes(true);
    await fetch(`/api/dashboard/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffNotes }),
    });
    setSavingNotes(false);
    setSavedNotes(true);
    setTimeout(() => setSavedNotes(false), 2000);
  }

  if (loading) return <div className="text-sm text-muted-foreground p-8">Loading…</div>;
  if (!booking) return <div className="text-sm text-muted-foreground p-8">Booking not found.</div>;

  const actions = ACTIONS[booking.status] ?? [];
  const waText = bookingReminderText({
    clientName: booking.clientName,
    serviceName: booking.serviceName,
    startsAt: booking.startsAt,
  });

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/dashboard/bookings"
          className="flex items-center gap-1 text-muted-foreground hover:text-foreground text-sm transition-colors"
        >
          <i className="bi bi-arrow-left text-xs" /> Bookings
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-cal text-2xl">{booking.clientName}</h1>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[booking.status]}`}>
          {booking.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: booking info + actions */}
        <div className="col-span-1 space-y-4">
          <div className="bg-white border rounded-xl p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Appointment</p>
            <div className="flex items-start gap-2.5">
              <i className="bi bi-calendar text-sm text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{format(new Date(booking.startsAt), "EEEE, d MMM yyyy")}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(booking.startsAt), "h:mm a")} — {format(new Date(booking.endsAt), "h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <i className="bi bi-scissors text-sm text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{booking.serviceName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <i className="bi bi-clock" style={{ fontSize: '0.75rem' }} /> {booking.serviceDuration} min
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <i className="bi bi-person text-sm text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{booking.staffName}</p>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Client</p>
            <div className="flex items-center gap-2 text-sm">
              <i className="bi bi-telephone text-xs text-muted-foreground shrink-0" />
              <span className="font-medium">{booking.clientPhone}</span>
            </div>
            {booking.clientEmail && (
              <div className="flex items-center gap-2 text-sm">
                <i className="bi bi-envelope text-xs text-muted-foreground shrink-0" />
                <span className="font-medium">{booking.clientEmail}</span>
              </div>
            )}
            <div className="flex gap-2 pt-1 flex-wrap">
              {booking.clientId && (
                <Link
                  href={`/dashboard/clients/${booking.clientId}`}
                  className="text-xs px-3 py-1.5 rounded border font-medium text-primary border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  CRM profile →
                </Link>
              )}
              <a
                href={whatsappUrl(booking.clientPhone, waText)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded border font-medium text-green-700 border-green-200 hover:bg-green-50 transition-colors"
              >
                <i className="bi bi-chat-square text-xs" /> WhatsApp
              </a>
            </div>
          </div>

          {/* Status actions */}
          {actions.length > 0 && (
            <div className="bg-white border rounded-xl p-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Actions</p>
              {actions.map((a) => (
                <button
                  key={a.next}
                  onClick={() => updateStatus(a.next)}
                  disabled={updatingStatus}
                  className={`w-full py-2.5 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${a.style}`}
                >
                  {updatingStatus ? "Updating…" : a.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: client note + staff notes */}
        <div className="col-span-2 space-y-5">
          {booking.notes && (
            <div className="bg-white border rounded-xl p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Client note</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}

          <div className="bg-white border rounded-xl p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Staff notes</p>
            <textarea
              rows={6}
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              placeholder="Add internal notes about this appointment…"
              className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none bg-white"
            />
            <div className="flex items-center gap-3 mt-2">
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="bg-gradient-to-b from-primary/90 to-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium border-b-2 border-primary/70 shadow-sm transition-all hover:shadow-primary/30 hover:shadow-md disabled:opacity-60"
              >
                {savingNotes ? "Saving…" : "Save notes"}
              </button>
              {savedNotes && (
                <span className="flex items-center gap-1.5 text-green-600 text-sm">
                  <i className="bi bi-check-circle text-sm" /> Saved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
