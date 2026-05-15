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
      <h2 className="font-cal text-lg mb-5 text-balance">Your details</h2>

      {/* Booking summary */}
      <div className="bg-muted/30 rounded-xl p-4 mb-5 text-sm space-y-2 border border-muted">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">Service</span>
          <span className="font-medium">{state.service?.name}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">With</span>
          <span className="font-medium">{state.staff?.name}</span>
        </div>
        <div className="flex justify-between items-start">
          <span className="text-muted-foreground shrink-0">When</span>
          <span className="font-medium text-right ml-4">{appointmentTime}</span>
        </div>
        {state.service && state.service.priceLkr > 0 && (
          <div className="flex justify-between items-center pt-2 border-t border-muted">
            <span className="font-medium">Total</span>
            <span className="font-bold text-primary tabular-nums">{formatLkr(state.service.priceLkr)}</span>
          </div>
        )}
      </div>

      {/* Contact form */}
      <div className="space-y-3.5 mb-5">
        <div>
          <label htmlFor="clientName" className="text-sm font-medium">
            Full name <span className="text-muted-foreground font-normal">*</span>
          </label>
          <input
            id="clientName"
            required
            type="text"
            autoComplete="name"
            value={state.clientName}
            onChange={(e) => onUpdate({ clientName: e.target.value })}
            className="mt-1.5 w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-shadow placeholder:text-muted-foreground/50"
            placeholder="Nimal Perera"
          />
        </div>
        <div>
          <label htmlFor="clientPhone" className="text-sm font-medium">
            Phone number <span className="text-muted-foreground font-normal">*</span>
          </label>
          <input
            id="clientPhone"
            required
            type="tel"
            autoComplete="tel"
            value={state.clientPhone}
            onChange={(e) => onUpdate({ clientPhone: e.target.value })}
            className="mt-1.5 w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-shadow placeholder:text-muted-foreground/50"
            placeholder="+94 77 123 4567"
          />
        </div>
        <div>
          <label htmlFor="clientEmail" className="text-sm font-medium">
            Email{" "}
            <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </label>
          <input
            id="clientEmail"
            type="email"
            autoComplete="email"
            value={state.clientEmail}
            onChange={(e) => onUpdate({ clientEmail: e.target.value })}
            className="mt-1.5 w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-shadow placeholder:text-muted-foreground/50"
            placeholder="you@email.com"
          />
        </div>
        <div>
          <label htmlFor="notes" className="text-sm font-medium">
            Notes{" "}
            <span className="text-muted-foreground font-normal text-xs">(optional)</span>
          </label>
          <textarea
            id="notes"
            value={state.notes}
            onChange={(e) => onUpdate({ notes: e.target.value })}
            className="mt-1.5 w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/25 focus:border-primary/50 transition-shadow resize-none placeholder:text-muted-foreground/50"
            rows={2}
            placeholder="Anything we should know?"
          />
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 text-destructive text-sm mb-4 bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2.5">
          <i className="bi bi-exclamation-circle text-sm shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <i className="bi bi-chevron-left text-sm" /> Back
        </button>
        <button
          onClick={handleBook}
          disabled={loading || !state.clientName || !state.clientPhone}
          className="ml-auto bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading
            ? "Booking…"
            : state.service?.requiresPayment
            ? "Book & Pay"
            : "Confirm booking"}
        </button>
      </div>
    </div>
  );
}
