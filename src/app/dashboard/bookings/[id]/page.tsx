"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { BookingReschedulePanel } from "@/components/dashboard/BookingReschedulePanel";
import { DashboardConfirmDialog } from "@/components/dashboard/DashboardConfirmDialog";
import { DashboardLoadingPanel } from "@/components/dashboard/DashboardLoadingPanel";
import { Button } from "@/components/ui/button";
import { dashboardInputClass } from "@/lib/dashboard-ui";
import { bookingReminderText, whatsappUrl } from "@/lib/whatsapp";
import { Icon } from "@/components/ui/Icon";
import type { IntakeAnswer } from "@/lib/intake";

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
  intakeAnswers: IntakeAnswer[] | null;
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
  no_show: "bg-gray-100 dark:bg-neutral-800 text-gray-600 dark:text-gray-400",
};

type BookingStatus = Booking["status"];

type BookingAction = {
  label: string;
  next: BookingStatus;
  variant?: "default" | "destructive" | "outline";
};

const ACTIONS: Record<string, BookingAction[]> = {
  pending: [
    { label: "Confirm", next: "confirmed", variant: "default" },
    { label: "Cancel", next: "cancelled", variant: "destructive" },
  ],
  confirmed: [
    { label: "Mark complete", next: "completed", variant: "default" },
    { label: "No-show", next: "no_show", variant: "outline" },
    { label: "Cancel", next: "cancelled", variant: "destructive" },
  ],
};

const DESTRUCTIVE_ACTIONS = new Set<BookingStatus>(["cancelled", "no_show"]);

const CONFIRM_COPY: Record<
  string,
  { title: string; description: string; confirmLabel: string; variant?: "destructive" | "default" }
> = {
  cancelled: {
    title: "Cancel this booking?",
    description: "The client will no longer have this appointment.",
    confirmLabel: "Cancel booking",
    variant: "destructive",
  },
  no_show: {
    title: "Mark as no-show?",
    description: "This records that the client did not attend.",
    confirmLabel: "Mark no-show",
    variant: "default",
  },
};

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [staffNotes, setStaffNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [savedNotes, setSavedNotes] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<BookingStatus | null>(null);

  useEffect(() => {
    fetch(`/api/dashboard/bookings/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setBooking(data);
        setStaffNotes(data.staffNotes ?? "");
        setLoading(false);
      });
  }, [id]);

  async function updateStatus(status: BookingStatus) {
    setUpdatingStatus(true);
    const res = await fetch(`/api/dashboard/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setBooking((b) => (b ? { ...b, status: updated.status } : b));
    }
    setUpdatingStatus(false);
  }

  function handleStatusAction(status: BookingStatus) {
    if (DESTRUCTIVE_ACTIONS.has(status)) {
      setConfirmStatus(status);
      return;
    }
    void updateStatus(status);
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

  if (loading) {
    return (
      <div className="p-2">
        <DashboardLoadingPanel rows={3} />
      </div>
    );
  }
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
          <Icon name="arrow-left" className="text-xs" /> Bookings
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-cal text-2xl">{booking.clientName}</h1>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[booking.status]}`}>
          {booking.status.replace("_", " ")}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: booking info + actions */}
        <div className="space-y-4 lg:col-span-1">
          <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 p-5 space-y-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Appointment</p>
            <div className="flex items-start gap-2.5">
              <Icon name="calendar" className="text-sm text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{format(new Date(booking.startsAt), "EEEE, d MMM yyyy")}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(booking.startsAt), "h:mm a")} — {format(new Date(booking.endsAt), "h:mm a")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Icon name="scissors" className="text-sm text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-medium">{booking.serviceName}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Icon name="clock" /> {booking.serviceDuration} min
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Icon name="person" className="text-sm text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-sm font-medium">{booking.staffName}</p>
            </div>
          </div>

          <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 p-5 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Client</p>
            <div className="flex items-center gap-2 text-sm">
              <Icon name="telephone" className="text-xs text-muted-foreground shrink-0" />
              <span className="font-medium">{booking.clientPhone}</span>
            </div>
            {booking.clientEmail && (
              <div className="flex items-center gap-2 text-sm">
                <Icon name="envelope" className="text-xs text-muted-foreground shrink-0" />
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
                <Icon name="chat-square" className="text-xs" /> WhatsApp
              </a>
            </div>
          </div>

          <BookingReschedulePanel
            bookingId={booking.id}
            serviceDuration={booking.serviceDuration}
            canReschedule={booking.status === "pending" || booking.status === "confirmed"}
            currentStartsAt={booking.startsAt}
          />

          {/* Status actions */}
          {actions.length > 0 && (
            <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 p-5 space-y-2">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Actions</p>
              {actions.map((a) => (
                <Button
                  key={a.next}
                  type="button"
                  variant={a.variant ?? "outline"}
                  className="w-full min-h-11"
                  onClick={() => handleStatusAction(a.next)}
                  disabled={updatingStatus}
                >
                  {updatingStatus ? "Updating…" : a.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Right: client note + staff notes */}
        <div className="space-y-5 lg:col-span-2">
          {booking.notes && (
            <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Client note</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{booking.notes}</p>
            </div>
          )}

          {booking.intakeAnswers && booking.intakeAnswers.length > 0 && (
            <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Intake answers</p>
              <dl className="space-y-3">
                {booking.intakeAnswers.map((a) => (
                  <div key={a.questionId}>
                    <dt className="text-xs text-muted-foreground flex items-center gap-1.5">
                      {a.label}
                      {a.sensitive && (
                        <span className="rounded bg-amber-100 text-amber-700 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">Sensitive</span>
                      )}
                    </dt>
                    <dd className="text-sm text-foreground whitespace-pre-wrap">{a.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <div className="bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900 p-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Staff notes</p>
            <textarea
              rows={6}
              value={staffNotes}
              onChange={(e) => setStaffNotes(e.target.value)}
              placeholder="Add internal notes about this appointment…"
              className={`${dashboardInputClass} mt-0 resize-none`}
            />
            <div className="mt-2 flex items-center gap-3">
              <Button type="button" onClick={saveNotes} disabled={savingNotes} className="min-h-11">
                {savingNotes ? "Saving…" : "Save notes"}
              </Button>
              {savedNotes && (
                <span className="flex items-center gap-1.5 text-green-600 text-sm">
                  <Icon name="check-circle" className="text-sm" /> Saved
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {confirmStatus && CONFIRM_COPY[confirmStatus] ? (
        <DashboardConfirmDialog
          open
          onOpenChange={(open) => {
            if (!open) setConfirmStatus(null);
          }}
          title={CONFIRM_COPY[confirmStatus].title}
          description={CONFIRM_COPY[confirmStatus].description}
          confirmLabel={CONFIRM_COPY[confirmStatus].confirmLabel}
          variant={CONFIRM_COPY[confirmStatus].variant}
          onConfirm={() => updateStatus(confirmStatus)}
        />
      ) : null}
    </div>
  );
}
