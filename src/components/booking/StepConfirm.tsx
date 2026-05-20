"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import type { BookingBusiness, BookingState } from "./BookingWizard";
import { formatLkr } from "@/lib/utils";
import type { BookingCopy } from "@/lib/i18n";

const COLOMBO_TZ = "Asia/Colombo";

interface Props {
  state: BookingState;
  business: BookingBusiness;
  copy: BookingCopy;
  onUpdate: (partial: Partial<BookingState>) => void;
  onBack: () => void;
  onConfirmed: (data: {
    bookingId: string;
    manualPayment?: boolean;
    payhereFormData?: Record<string, string>;
    payhereUrl?: string;
    status?: string;
  }) => void;
}

export default function StepConfirm({ state, business, copy, onUpdate, onBack, onConfirmed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const service = state.service;
  const depositAmount =
    service && service.depositPercent > 0
      ? Math.ceil((service.priceLkr * service.depositPercent) / 100)
      : service?.priceLkr ?? 0;
  const dueNow =
    service?.requiresPayment && service.priceLkr > 0
      ? service.depositPercent > 0
        ? depositAmount
        : service.priceLkr
      : 0;

  const dateLabel = state.date
    ? format(parseISO(state.date + "T12:00:00"), "EEEE, d MMMM")
    : "";
  const yearLabel = state.date ? format(parseISO(state.date + "T12:00:00"), "yyyy") : "";

  const hasManualPaymentFallback = Boolean(
    service?.requiresPayment &&
      service.priceLkr > 0 &&
      !business.payhereEnabled &&
      (business.bankTransferInstructions || business.lankaqrImageUrl)
  );

  const payLabel =
    service?.requiresPayment && !hasManualPaymentFallback && dueNow > 0
      ? `${copy.confirmAndPay} — ${formatLkr(dueNow)}`
      : copy.confirmBooking;

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
      manualPayment: data.manualPayment,
      payhereFormData: data.payhereFormData,
      payhereUrl: data.payhereUrl,
      status: data.status,
    });
  }

  const summaryCards = (
    <div className="flex flex-col gap-2 md:gap-3">
      <div className="rounded-2xl bg-white px-[15px] py-[13px] md:rounded-xl md:border md:border-gray-100 md:p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
          {copy.selectedService}
        </p>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold leading-snug text-gray-900 md:text-base">
              {service?.name}
            </p>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-400 md:text-xs">
              <i className="bi bi-clock text-[10px] text-gray-300" />
              {service?.durationMinutes} min
              {state.staff && (
                <>
                  <span className="text-gray-300">·</span>
                  {state.staff.name}
                </>
              )}
            </div>
          </div>
          <p className="shrink-0 text-base font-bold tabular-nums text-blue-600 md:text-lg">
            {service && service.priceLkr > 0 ? formatLkr(service.priceLkr) : "Free"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white px-[15px] py-[13px] md:rounded-xl md:border md:border-gray-100 md:p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400">
          {copy.appointment}
        </p>
        <div className="mb-2 flex items-center gap-[11px]">
          <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-blue-50">
            <i className="bi bi-calendar3 text-[13px] text-blue-500" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-900 md:text-sm">{dateLabel}</p>
            <p className="text-[11px] text-gray-400 md:text-xs">{yearLabel}</p>
          </div>
        </div>
        <div className="mb-2 h-px bg-gray-100" />
        <div className="flex items-center gap-[11px]">
          <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-emerald-50">
            <i className="bi bi-clock text-[13px] text-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-gray-900 md:text-sm">{state.timeLabel}</p>
            <p className="text-[11px] text-gray-400 md:text-xs">{service?.durationMinutes} min</p>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
            {copy.available}
          </span>
        </div>
      </div>

      {service && service.priceLkr > 0 && (
        <div className="rounded-2xl bg-white px-[15px] py-[13px] md:rounded-xl md:border md:border-gray-100 md:p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-gray-500">{service.name}</p>
            <p className="text-[12px] font-medium tabular-nums text-gray-700">
              {formatLkr(service.priceLkr)}
            </p>
          </div>
          {service.requiresPayment && service.depositPercent > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <p className="text-[11px] text-gray-400">
                {copy.depositDue} ({service.depositPercent}%)
              </p>
              <p className="text-[11px] font-semibold tabular-nums text-blue-600">
                {formatLkr(depositAmount)}
              </p>
            </div>
          )}
          <div className="my-2 h-px bg-gray-100" />
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-gray-900">{copy.fullAmount}</p>
            <p className="text-[14px] font-bold tabular-nums text-gray-900">
              {formatLkr(service.priceLkr)}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const contactForm = (
    <div className="space-y-3 md:rounded-xl md:border md:border-gray-100 md:bg-white md:p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 md:mb-1">
        {copy.details}
      </p>
      <div>
        <label htmlFor="clientName" className="text-sm font-medium text-gray-800">
          Full name <span className="font-normal text-gray-400">*</span>
        </label>
        <input
          id="clientName"
          required
          type="text"
          autoComplete="name"
          value={state.clientName}
          onChange={(e) => onUpdate({ clientName: e.target.value })}
          className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-shadow placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="Nimal Perera"
        />
      </div>
      <div>
        <label htmlFor="clientPhone" className="text-sm font-medium text-gray-800">
          Phone number <span className="font-normal text-gray-400">*</span>
        </label>
        <input
          id="clientPhone"
          required
          type="tel"
          autoComplete="tel"
          value={state.clientPhone}
          onChange={(e) => onUpdate({ clientPhone: e.target.value })}
          className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-shadow placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="+94 77 123 4567"
        />
      </div>
      <div>
        <label htmlFor="clientEmail" className="text-sm font-medium text-gray-800">
          Email <span className="text-xs font-normal text-gray-400">(optional)</span>
        </label>
        <input
          id="clientEmail"
          type="email"
          autoComplete="email"
          value={state.clientEmail}
          onChange={(e) => onUpdate({ clientEmail: e.target.value })}
          className="mt-1.5 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-shadow placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="you@email.com"
        />
      </div>
      <div>
        <label htmlFor="notes" className="text-sm font-medium text-gray-800">
          Notes <span className="text-xs font-normal text-gray-400">(optional)</span>
        </label>
        <textarea
          id="notes"
          value={state.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm transition-shadow placeholder:text-gray-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          rows={2}
          placeholder={
            hasManualPaymentFallback ? copy.paymentReference : "Anything we should know?"
          }
        />
      </div>
    </div>
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 bg-[#f2f2f7] px-[14px] py-3 md:grid md:grid-cols-2 md:gap-8 md:bg-transparent md:px-8 md:py-7">
        <div>{summaryCards}</div>
        <div>
          {hasManualPaymentFallback && (
            <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-sm md:mb-4">
              <p className="mb-2 font-medium text-amber-900">{copy.localPayment}</p>
              {business.bankTransferInstructions && (
                <p className="whitespace-pre-wrap text-amber-900/80">
                  {business.bankTransferInstructions}
                </p>
              )}
              {business.lankaqrImageUrl && (
                <div className="mt-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={business.lankaqrImageUrl}
                    alt="LankaQR"
                    className="h-36 w-36 rounded-lg border bg-white object-contain p-2"
                  />
                </div>
              )}
            </div>
          )}
          {contactForm}
        </div>
      </div>

      {error && (
        <div className="mx-[14px] mb-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 md:mx-0">
          <i className="bi bi-exclamation-circle mt-0.5 shrink-0 text-sm" />
          <span>{error}</span>
        </div>
      )}

      {/* Mobile pinned CTA */}
      <div className="sticky bottom-0 z-10 border-t border-gray-200/80 bg-[#f2f2f7]/95 px-[14px] pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:relative md:mt-6 md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0">
        <div className="mb-2 flex md:mb-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 md:mr-4"
          >
            <i className="bi bi-chevron-left text-sm" /> {copy.back}
          </button>
        </div>
        <button
          type="button"
          onClick={handleBook}
          disabled={loading || !state.clientName || !state.clientPhone}
          className="w-full rounded-[14px] bg-gradient-to-r from-blue-600 to-blue-700 py-[17px] text-[16px] font-bold text-white shadow-lg shadow-blue-500/25 transition-opacity hover:from-blue-700 hover:to-blue-800 disabled:cursor-not-allowed disabled:opacity-50 md:rounded-xl md:py-3.5 md:text-sm md:font-semibold"
        >
          {loading ? "Booking…" : payLabel}
        </button>
        <div className="mt-2 flex items-center justify-center gap-1 md:mt-3">
          <i className="bi bi-shield-check text-[11px] text-gray-300" />
          <span className="text-[11px] text-gray-400">{copy.securedByPayHere}</span>
        </div>
      </div>
    </div>
  );
}
