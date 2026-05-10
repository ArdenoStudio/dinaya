"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { Business } from "@/db/schema";
import type { BookingState } from "./BookingWizard";
import { formatLkr } from "@/lib/utils";

const COLOMBO_TZ = "Asia/Colombo";

interface Props {
  state: BookingState;
  business: Business;
  onUpdate: (partial: Partial<BookingState>) => void;
  onBack: () => void;
  onConfirmed: (data: {
    bookingId: string;
    payhereFormData?: Record<string, string>;
    payhereUrl?: string;
  }) => void;
}

export default function StepConfirm({ state, business, onUpdate, onBack, onConfirmed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const appointmentTime = state.timeSlot
    ? format(toZonedTime(parseISO(state.timeSlot), COLOMBO_TZ), "EEEE, d MMMM yyyy 'at' h:mm a")
    : "";

  async function handleBook() {
    setLoading(true);
    setError("");

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: business.id,
        serviceId: state.service!.id,
        staffId: state.staff!.id,
        startsAt: state.timeSlot,
        endsAt: state.timeSlotEnd,
        clientName: state.clientName,
        clientPhone: state.clientPhone,
        clientEmail: state.clientEmail,
        notes: state.notes,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    onConfirmed({
      bookingId: data.bookingId,
      payhereFormData: data.payhereFormData,
      payhereUrl: data.payhereUrl,
    });
  }

  return (
    <div>
      <h2 className="font-semibold text-lg mb-5">Your details</h2>

      {/* Summary */}
      <div className="bg-muted/40 rounded-lg p-4 mb-5 text-sm space-y-1.5">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium">{state.service?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">With</span>
          <span className="font-medium">{state.staff?.name}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">When</span>
          <span className="font-medium text-right max-w-[60%]">{appointmentTime}</span>
        </div>
        {state.service && state.service.priceLkr > 0 && (
          <div className="flex justify-between pt-1.5 border-t">
            <span className="font-medium">Total</span>
            <span className="font-bold text-primary">{formatLkr(state.service.priceLkr)}</span>
          </div>
        )}
      </div>

      {/* Contact form */}
      <div className="space-y-3 mb-5">
        <div>
          <label className="text-sm font-medium">Full name *</label>
          <input
            required
            value={state.clientName}
            onChange={(e) => onUpdate({ clientName: e.target.value })}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Nimal Perera"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Phone number *</label>
          <input
            required
            value={state.clientPhone}
            onChange={(e) => onUpdate({ clientPhone: e.target.value })}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="+94 77 123 4567"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Email (optional)</label>
          <input
            type="email"
            value={state.clientEmail}
            onChange={(e) => onUpdate({ clientEmail: e.target.value })}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Notes (optional)</label>
          <textarea
            value={state.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            rows={2}
            placeholder="Anything we should know?"
          />
        </div>
      </div>

      {error && <p className="text-destructive text-sm mb-3">{error}</p>}

      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">
          ← Back
        </button>
        <button
          onClick={handleBook}
          disabled={loading || !state.clientName || !state.clientPhone}
          className="ml-auto bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
        >
          {loading
            ? "Booking…"
            : state.service?.requiresPayment
            ? "Book & Pay →"
            : "Confirm booking →"}
        </button>
      </div>
    </div>
  );
}
