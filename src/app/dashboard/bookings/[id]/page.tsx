"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { format } from "date-fns";

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
    { label: "Confirm", next: "confirmed", style: "bg-green-600 hover:bg-green-700 text-white" },
    { label: "Cancel", next: "cancelled", style: "bg-red-500 hover:bg-red-600 text-white" },
  ],
  confirmed: [
    { label: "Mark complete", next: "completed", style: "bg-blue-600 hover:bg-blue-700 text-white" },
    { label: "No-show", next: "no_show", style: "bg-gray-500 hover:bg-gray-600 text-white" },
    { label: "Cancel", next: "cancelled", style: "bg-red-500 hover:bg-red-600 text-white" },
  ],
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffNotes, setStaffNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
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
  }

  if (loading) return <div className="text-sm text-muted-foreground p-8">Loading…</div>;
  if (!booking) return <div className="text-sm text-muted-foreground p-8">Booking not found.</div>;

  const actions = ACTIONS[booking.status] ?? [];
  const waText = encodeURIComponent(
    `Hi ${booking.clientName}, this is a reminder for your appointment on ${format(new Date(booking.startsAt), "d MMM 'at' h:mm a")} for ${booking.serviceName}. See you soon!`
  );
  const waPhone = booking.clientPhone.replace(/\D/g, "");

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/bookings" className="text-muted-foreground hover:text-foreground text-sm">
          ← Bookings
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
          <div className="bg-white border rounded-xl p-5 space-y-3">
            <h2 className="font-medium text-sm">Appointment</h2>
            <div>
              <p className="text-xs text-muted-foreground">Date & time</p>
              <p className="text-sm font-medium">{format(new Date(booking.startsAt), "EEEE, d MMM yyyy")}</p>
              <p className="text-sm text-muted-foreground">{format(new Date(booking.startsAt), "h:mm a")} — {format(new Date(booking.endsAt), "h:mm a")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Service</p>
              <p className="text-sm font-medium">{booking.serviceName} ({booking.serviceDuration} min)</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Staff</p>
              <p className="text-sm font-medium">{booking.staffName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Booked on</p>
              <p className="text-sm font-medium">{format(new Date(booking.createdAt), "d MMM yyyy")}</p>
            </div>
          </div>

          <div className="bg-white border rounded-xl p-5 space-y-3">
            <h2 className="font-medium text-sm">Client</h2>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-sm font-medium">{booking.clientPhone}</p>
            </div>
            {booking.clientEmail && (
              <div>
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{booking.clientEmail}</p>
              </div>
            )}
            <div className="flex gap-2 pt-1">
              {booking.clientId && (
                <Link
                  href={`/dashboard/clients/${booking.clientId}`}
                  className="text-xs px-3 py-1.5 rounded border font-medium text-primary border-primary/30 hover:bg-primary/5 transition-colors"
                >
                  View CRM profile →
                </Link>
              )}
              <a
                href={`https://wa.me/${waPhone}?text=${waText}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs px-3 py-1.5 rounded border font-medium text-green-700 border-green-200 hover:bg-green-50 transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>

          {/* Status actions */}
          {actions.length > 0 && (
            <div className="bg-white border rounded-xl p-5 space-y-2">
              <h2 className="font-medium text-sm mb-3">Actions</h2>
              {actions.map((a) => (
                <button
                  key={a.next}
                  onClick={() => updateStatus(a.next)}
                  disabled={updatingStatus}
                  className={`w-full py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50 ${a.style}`}
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
              <h2 className="font-medium text-sm mb-3">Client note</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}

          <div className="bg-white border rounded-xl p-5">
            <h2 className="font-medium text-sm mb-3">Staff notes</h2>
            <textarea
              rows={6}
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              placeholder="Add internal notes about this appointment…"
              className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <button
              onClick={saveNotes}
              disabled={savingNotes}
              className="mt-2 bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
            >
              {savingNotes ? "Saving…" : "Save notes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
