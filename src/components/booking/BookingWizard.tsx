"use client";

import { useState } from "react";
import type { Business, Service, Staff } from "@/db/schema";
import StepService from "./StepService";
import StepStaff from "./StepStaff";
import StepDateTime from "./StepDateTime";
import StepConfirm from "./StepConfirm";

interface Props {
  business: Business;
  services: Service[];
  staff: Staff[];
  staffServiceMap: { staffId: string; serviceId: string }[];
}

export type BookingState = {
  service: Service | null;
  staff: Staff | null;
  date: string;        // "YYYY-MM-DD"
  timeSlot: string;    // ISO UTC string
  timeSlotEnd: string; // ISO UTC string
  timeLabel: string;   // "9:00 AM"
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
};

const STEPS = ["Service", "Staff", "Date & Time", "Your details"];

export default function BookingWizard({ business, services, staff, staffServiceMap }: Props) {
  const [step, setStep] = useState(0);
  const [state, setState] = useState<BookingState>({
    service: null,
    staff: null,
    date: "",
    timeSlot: "",
    timeSlotEnd: "",
    timeLabel: "",
    clientName: "",
    clientPhone: "",
    clientEmail: "",
    notes: "",
  });
  const [confirmed, setConfirmed] = useState<{ bookingId: string; payhereFormData?: Record<string, string>; payhereUrl?: string } | null>(null);

  function update(partial: Partial<BookingState>) {
    setState((s) => ({ ...s, ...partial }));
  }

  function next() { setStep((s) => s + 1); }
  function back() { setStep((s) => s - 1); }

  if (confirmed) {
    if (confirmed.payhereFormData && confirmed.payhereUrl) {
      // Auto-submit PayHere form
      return (
        <div className="bg-white border rounded-xl p-8 text-center">
          <div className="text-4xl mb-4">💳</div>
          <h2 className="text-xl font-bold mb-2">Redirecting to payment…</h2>
          <p className="text-muted-foreground text-sm mb-6">You&apos;ll be taken to PayHere to complete your booking.</p>
          <form id="payhere-form" method="POST" action={confirmed.payhereUrl}>
            {Object.entries(confirmed.payhereFormData).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium"
              onClick={() => (document.getElementById("payhere-form") as HTMLFormElement)?.submit()}
            >
              Pay now →
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="bg-white border rounded-xl p-8 text-center">
        <div className="text-5xl mb-4">✅</div>
        <h2 className="text-xl font-bold mb-2">Booking confirmed!</h2>
        <p className="text-muted-foreground text-sm mb-2">
          We&apos;ve sent a confirmation to {state.clientEmail || state.clientPhone}.
        </p>
        <p className="text-xs text-muted-foreground">
          Ref: {confirmed.bookingId.slice(0, 8).toUpperCase()}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      {/* Progress bar */}
      <div className="flex border-b">
        {STEPS.map((label, i) => (
          <div
            key={label}
            className={`flex-1 text-center py-3 text-xs font-medium transition-colors ${
              i === step
                ? "bg-primary text-primary-foreground"
                : i < step
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground"
            }`}
          >
            {label}
          </div>
        ))}
      </div>

      <div className="p-6">
        {step === 0 && (
          <StepService
            services={services}
            selected={state.service}
            onSelect={(s) => { update({ service: s, staff: null, date: "", timeSlot: "" }); next(); }}
          />
        )}
        {step === 1 && (
          <StepStaff
            allStaff={staff}
            staffServiceMap={staffServiceMap}
            serviceId={state.service!.id}
            selected={state.staff}
            onSelect={(s) => { update({ staff: s, date: "", timeSlot: "" }); next(); }}
            onBack={back}
          />
        )}
        {step === 2 && (
          <StepDateTime
            businessId={business.id}
            service={state.service!}
            staff={state.staff!}
            onSelect={(date, slot) => {
              update({
                date,
                timeSlot: slot.startUtc,
                timeSlotEnd: slot.endUtc,
                timeLabel: slot.label,
              });
              next();
            }}
            onBack={back}
          />
        )}
        {step === 3 && (
          <StepConfirm
            state={state}
            business={business}
            onUpdate={update}
            onBack={back}
            onConfirmed={setConfirmed}
          />
        )}
      </div>
    </div>
  );
}
