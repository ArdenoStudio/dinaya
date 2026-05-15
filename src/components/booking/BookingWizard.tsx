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
  date: string;
  timeSlot: string;
  timeSlotEnd: string;
  timeLabel: string;
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
  const [confirmed, setConfirmed] = useState<{
    bookingId: string;
    payhereFormData?: Record<string, string>;
    payhereUrl?: string;
  } | null>(null);

  function update(partial: Partial<BookingState>) {
    setState((s) => ({ ...s, ...partial }));
  }

  function next() { setStep((s) => s + 1); }
  function back() { setStep((s) => s - 1); }

  if (confirmed) {
    if (confirmed.payhereFormData && confirmed.payhereUrl) {
      return (
        <div className="bg-white border rounded-xl p-10 text-center">
          <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <i className="bi bi-credit-card text-2xl text-primary" />
          </div>
          <h2 className="font-cal text-xl mb-2 text-balance">Redirecting to payment…</h2>
          <p className="text-muted-foreground text-sm mb-6 text-pretty">
            You&apos;ll be taken to PayHere to complete your booking.
          </p>
          <form id="payhere-form" method="POST" action={confirmed.payhereUrl}>
            {Object.entries(confirmed.payhereFormData).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            <button
              type="submit"
              className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors"
              onClick={() => (document.getElementById("payhere-form") as HTMLFormElement)?.submit()}
            >
              Pay now
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="bg-white border rounded-xl p-10 text-center">
        <div className="size-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
          <i className="bi bi-check-circle-fill text-2xl text-emerald-600" />
        </div>
        <h2 className="font-cal text-xl mb-2 text-balance">Booking confirmed!</h2>
        <p className="text-muted-foreground text-sm mb-1 text-pretty">
          We&apos;ve sent a confirmation to {state.clientEmail || state.clientPhone}.
        </p>
        <p className="text-xs text-muted-foreground/60 mt-2">
          Ref: {confirmed.bookingId.slice(0, 8).toUpperCase()}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border rounded-xl overflow-hidden">
      {/* Step progress */}
      <div className="flex border-b">
        {STEPS.map((label, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div
              key={label}
              className={`flex-1 flex flex-col items-center justify-center py-3 gap-0.5 text-[11px] font-medium transition-colors border-r last:border-r-0 ${
                active
                  ? "bg-primary text-primary-foreground"
                  : done
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground/60 bg-transparent"
              }`}
            >
              <span
                className={`size-5 rounded-full flex items-center justify-center text-[10px] font-bold mb-0.5 ${
                  active
                    ? "bg-white/20 text-white"
                    : done
                    ? "bg-primary/15 text-primary"
                    : "bg-muted/40 text-muted-foreground/50"
                }`}
              >
                {done ? <i className="bi bi-check" style={{ fontSize: '0.75rem' }} /> : i + 1}
              </span>
              <span className="hidden sm:block">{label}</span>
            </div>
          );
        })}
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
