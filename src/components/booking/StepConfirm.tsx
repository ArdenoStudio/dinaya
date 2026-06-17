"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import type { BookingBusiness, BookingState } from "./BookingWizard";
import { formatLkr, isOptimizableRemoteImage } from "@/lib/utils";
import type { BookingCopy } from "@/lib/i18n";
import { readStoredAttribution } from "@/lib/booking-attribution";
import { getBookingSessionToken } from "@/lib/booking-session";
import { computeAmountDueFromDiscountedPrice, computeDiscountedPrice } from "@/lib/deals/pricing";
import { trackDealBookingComplete, trackDealBookingStart } from "@/lib/analytics/gtag";
import {
  getAvailablePaymentMethods,
  resolveDefaultPaymentMethod,
} from "@/lib/payments/resolve";
import type { DealListItem } from "@/lib/deals/queries";
import { Icon } from "@/components/ui/Icon";

interface Props {
  state: BookingState;
  business: BookingBusiness;
  copy: BookingCopy;
  selectedDeal?: DealListItem | null;
  sessionToken?: string;
  onUpdate: (partial: Partial<BookingState>) => void;
  onBack: () => void;
  onConfirmed: (data: {
    bookingId: string;
    manualPayment?: boolean;
    payhereFormData?: Record<string, string>;
    payhereUrl?: string;
    approvalUrl?: string;
    provider?: string;
    status?: string;
  }) => void;
}

export default function StepConfirm({ state, business, copy, selectedDeal, sessionToken, onUpdate, onBack, onConfirmed }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [upsell, setUpsell] = useState<{
    name: string;
    priceLkr: number;
    reason: string;
  } | null>(null);

  const service = state.service;
  const discountedPrice = service && selectedDeal
    ? computeDiscountedPrice(service.priceLkr, selectedDeal.discountPercent)
    : service?.priceLkr ?? 0;
  const depositAmount =
    service && service.depositPercent > 0
      ? selectedDeal
        ? computeAmountDueFromDiscountedPrice(discountedPrice, service.depositPercent)
        : Math.ceil((service.priceLkr * service.depositPercent) / 100)
      : discountedPrice;
  const dueNow =
    service?.requiresPayment && discountedPrice > 0
      ? service.depositPercent > 0
        ? depositAmount
        : discountedPrice
      : 0;

  const onlineMethods = getAvailablePaymentMethods(
    {
      payhereEnabled: Boolean(business.payhereEnabled),
      payhereMerchantId: business.payhereEnabled ? "configured" : null,
      payhereMerchantSecret: business.payhereEnabled ? "configured" : null,
      paypalEnabled: Boolean(business.paypalEnabled),
      paypalClientId: business.paypalEnabled ? "configured" : null,
      paypalClientSecret: business.paypalEnabled ? "configured" : null,
      bankTransferInstructions: business.bankTransferInstructions ?? null,
      lankaqrImageUrl: business.lankaqrImageUrl ?? null,
    },
    Boolean(service?.requiresPayment),
    dueNow,
    Boolean(business.payhereEnabled),
    Boolean(business.paypalEnabled),
  ).filter((method) => method === "payhere" || method === "paypal") as Array<"payhere" | "paypal">;

  const [paymentMethod, setPaymentMethod] = useState<"payhere" | "paypal">(() =>
    resolveDefaultPaymentMethod(onlineMethods, state.clientPhone) === "paypal" ? "paypal" : "payhere",
  );

  useEffect(() => {
    const next = resolveDefaultPaymentMethod(onlineMethods, state.clientPhone);
    if (next === "payhere" || next === "paypal") {
      setPaymentMethod(next);
    }
  }, [onlineMethods, state.clientPhone]);

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

  useEffect(() => {
    if (!service || selectedDeal) {
      setUpsell(null);
      return;
    }
    const params = new URLSearchParams({
      businessId: business.id,
      serviceId: service.id,
    });
    if (state.location?.id) params.set("locationId", state.location.id);
    fetch(`/api/ai/upsell?${params}`)
      .then((res) => res.json())
      .then((data) => setUpsell(data.recommendation ?? null))
      .catch(() => setUpsell(null));
  }, [business.id, service, state.location?.id, selectedDeal]);

  useEffect(() => {
    if (selectedDeal) {
      trackDealBookingStart({
        dealId: selectedDeal.id,
        businessSlug: business.slug,
        serviceId: service?.id,
        discountPercent: selectedDeal.discountPercent,
      });
    }
  }, [selectedDeal, business.slug, service?.id]);

  async function handleBook() {
    const questions = service?.intakeQuestions ?? [];
    for (const q of questions) {
      if (q.required && !(state.intakeAnswers[q.id] ?? "").trim()) {
        setError(`Please answer: ${q.label}`);
        return;
      }
    }

    setLoading(true);
    setError("");

    const attribution = readStoredAttribution(business.id);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId: business.id,
        serviceId: state.service!.id,
        staffId: state.staff!.id,
        locationId: state.location?.id ?? null,
        startsAt: state.timeSlot,
        endsAt: state.timeSlotEnd,
        clientName: state.clientName,
        clientPhone: state.clientPhone,
        clientEmail: state.clientEmail,
        notes: state.notes,
        intakeAnswers: Object.entries(state.intakeAnswers)
          .filter(([, v]) => v != null && v !== "")
          .map(([questionId, value]) => ({ questionId, value })),
        dealId: selectedDeal?.id ?? null,
        sessionToken: sessionToken || getBookingSessionToken() || undefined,
        paymentMethod: onlineMethods.length > 1 ? paymentMethod : onlineMethods[0] ?? undefined,
        attribution,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    if (selectedDeal) {
      trackDealBookingComplete({
        dealId: selectedDeal.id,
        businessSlug: business.slug,
        discountPercent: selectedDeal.discountPercent,
        bookingId: data.bookingId,
        discountedPriceLkr: discountedPrice,
      });
    }

    onConfirmed({
      bookingId: data.bookingId,
      manualPayment: data.manualPayment,
      payhereFormData: data.payhereFormData,
      payhereUrl: data.payhereUrl,
      approvalUrl: data.approvalUrl,
      provider: data.provider,
      status: data.status,
    });
  }

  const summaryCards = (
    <div className="flex flex-col gap-2 md:gap-3">
      <div className="rounded-2xl bg-white dark:bg-neutral-900 px-[15px] py-[13px] md:rounded-xl md:border md:border-gray-100 dark:border-neutral-800 md:p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
          {copy.selectedService}
        </p>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[15px] font-semibold leading-snug text-gray-900 dark:text-gray-100 md:text-base">
              {service?.name}
            </p>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 md:text-xs">
              <Icon name="clock" className="text-[10px] text-gray-300" />
              {service?.durationMinutes} min
              {state.staff && (
                <>
                  <span className="text-gray-300">·</span>
                  {state.staff.name}
                </>
              )}
            </div>
          </div>
          <p className="shrink-0 text-base font-bold tabular-nums booking-text-accent md:text-lg">
            {service && service.priceLkr > 0 ? formatLkr(service.priceLkr) : "Free"}
          </p>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-neutral-900 px-[15px] py-[13px] md:rounded-xl md:border md:border-gray-100 dark:border-neutral-800 md:p-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.08em] text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
          {copy.appointment}
        </p>
        <div className="mb-2 flex items-center gap-[11px]">
          <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] booking-bg-accent-muted">
            <Icon name="calendar3" className="text-[13px] booking-text-accent" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 md:text-sm">{dateLabel}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 md:text-xs">{yearLabel}</p>
          </div>
        </div>
        <div className="mb-2 h-px bg-gray-100 dark:bg-neutral-800" />
        <div className="flex items-center gap-[11px]">
          <div className="flex size-[34px] shrink-0 items-center justify-center rounded-[10px] bg-emerald-50 dark:bg-emerald-950/40">
            <Icon name="clock" className="text-[13px] text-emerald-500" />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-gray-900 dark:text-gray-100 md:text-sm">{state.timeLabel}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 md:text-xs">{service?.durationMinutes} min</p>
          </div>
          <span className="shrink-0 rounded-full border border-emerald-100 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
            {copy.available}
          </span>
        </div>
      </div>

      {service && service.priceLkr > 0 && (
        <div className="rounded-2xl bg-white dark:bg-neutral-900 px-[15px] py-[13px] md:rounded-xl md:border md:border-gray-100 dark:border-neutral-800 md:p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-gray-500 dark:text-gray-400">{service.name}</p>
            <p className="text-[12px] font-medium tabular-nums text-gray-700 dark:text-gray-300">
              {formatLkr(service.priceLkr)}
            </p>
          </div>
          {service.requiresPayment && service.depositPercent > 0 && (
            <div className="mt-1 flex items-center justify-between">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                {copy.depositDue} ({service.depositPercent}%)
              </p>
              <p className="text-[11px] font-semibold tabular-nums booking-text-accent">
                {formatLkr(depositAmount)}
              </p>
            </div>
          )}
          <div className="my-2 h-px bg-gray-100 dark:bg-neutral-800" />
          {selectedDeal && (
            <div className="mb-2 flex items-center justify-between text-emerald-700">
              <p className="text-[12px] font-medium">
                Deal discount ({selectedDeal.discountPercent}%)
              </p>
              <p className="text-[12px] font-semibold tabular-nums">
                −{formatLkr(service.priceLkr - discountedPrice)}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-[13px] font-bold text-gray-900 dark:text-gray-100">{copy.fullAmount}</p>
            <p className="text-[14px] font-bold tabular-nums text-gray-900 dark:text-gray-100">
              {selectedDeal ? (
                <>
                  <span className="mr-2 text-[12px] font-medium text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 line-through">
                    {formatLkr(service.priceLkr)}
                  </span>
                  {formatLkr(discountedPrice)}
                </>
              ) : (
                formatLkr(service.priceLkr)
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );

  const contactForm = (
    <div className="space-y-3 md:rounded-xl md:border md:border-gray-100 dark:border-neutral-800 md:bg-white dark:md:bg-neutral-900 md:p-5">
      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 md:mb-1">
        {copy.details}
      </p>
      <div>
        <label htmlFor="clientName" className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Full name <span className="font-normal text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">*</span>
        </label>
        <input
          id="clientName"
          required
          type="text"
          autoComplete="name"
          value={state.clientName}
          onChange={(e) => onUpdate({ clientName: e.target.value })}
          className="mt-1.5 w-full rounded-xl border border-gray-200 dark:border-neutral-800 px-3 py-2.5 text-sm transition-shadow placeholder:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="Nimal Perera"
        />
      </div>
      <div>
        <label htmlFor="clientPhone" className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Phone number <span className="font-normal text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">*</span>
        </label>
        <input
          id="clientPhone"
          required
          type="tel"
          autoComplete="tel"
          value={state.clientPhone}
          onChange={(e) => onUpdate({ clientPhone: e.target.value })}
          className="mt-1.5 w-full rounded-xl border border-gray-200 dark:border-neutral-800 px-3 py-2.5 text-sm transition-shadow placeholder:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="+94 77 123 4567"
        />
      </div>
      <div>
        <label htmlFor="clientEmail" className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Email <span className="text-xs font-normal text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">(optional)</span>
        </label>
        <input
          id="clientEmail"
          type="email"
          autoComplete="email"
          value={state.clientEmail}
          onChange={(e) => onUpdate({ clientEmail: e.target.value })}
          className="mt-1.5 w-full rounded-xl border border-gray-200 dark:border-neutral-800 px-3 py-2.5 text-sm transition-shadow placeholder:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          placeholder="you@email.com"
        />
      </div>
      <div>
        <label htmlFor="notes" className="text-sm font-medium text-gray-800 dark:text-gray-200">
          Notes <span className="text-xs font-normal text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">(optional)</span>
        </label>
        <textarea
          id="notes"
          value={state.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 dark:border-neutral-800 px-3 py-2.5 text-sm transition-shadow placeholder:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          rows={2}
          placeholder={
            hasManualPaymentFallback ? copy.paymentReference : "Anything we should know?"
          }
        />
      </div>

      {(service?.intakeQuestions ?? []).length > 0 && (
        <div className="space-y-3 border-t border-gray-100 dark:border-neutral-800 pt-3">
          {(service?.intakeQuestions ?? []).map((q) => {
            const value = state.intakeAnswers[q.id] ?? "";
            const setValue = (v: string) =>
              onUpdate({ intakeAnswers: { ...state.intakeAnswers, [q.id]: v } });
            const fieldCls =
              "mt-1.5 w-full rounded-xl border border-gray-200 dark:border-neutral-800 px-3 py-2.5 text-sm transition-shadow placeholder:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20";
            return (
              <div key={q.id}>
                <label htmlFor={`intake-${q.id}`} className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {q.label}{" "}
                  {q.required ? (
                    <span className="font-normal text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">*</span>
                  ) : (
                    <span className="text-xs font-normal text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">(optional)</span>
                  )}
                </label>
                {q.type === "textarea" ? (
                  <textarea id={`intake-${q.id}`} value={value} rows={2}
                    onChange={(e) => setValue(e.target.value)} className={`${fieldCls} resize-none`} />
                ) : q.type === "select" ? (
                  <select id={`intake-${q.id}`} value={value}
                    onChange={(e) => setValue(e.target.value)} className={fieldCls}>
                    <option value="">Select…</option>
                    {(q.options ?? []).map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                ) : q.type === "boolean" ? (
                  <select id={`intake-${q.id}`} value={value}
                    onChange={(e) => setValue(e.target.value)} className={fieldCls}>
                    <option value="">Select…</option>
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                ) : (
                  <input id={`intake-${q.id}`} type="text" value={value}
                    onChange={(e) => setValue(e.target.value)} className={fieldCls} />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 booking-panel-bg px-[14px] py-3 md:grid md:grid-cols-2 md:gap-8 md:bg-transparent md:px-8 md:py-7">
        <div>{summaryCards}</div>
        <div>
          {hasManualPaymentFallback && (
            <div className="mb-3 rounded-xl border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm md:mb-4">
              <p className="mb-2 font-medium text-amber-900 dark:text-amber-200">{copy.localPayment}</p>
              {business.bankTransferInstructions && (
                <p className="whitespace-pre-wrap text-amber-900 dark:text-amber-200/80">
                  {business.bankTransferInstructions}
                </p>
              )}
              {business.lankaqrImageUrl && (
                <div className="mt-3">
                  <Image
                    src={business.lankaqrImageUrl}
                    alt="LankaQR"
                    width={144}
                    height={144}
                    className="h-36 w-36 rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 object-contain p-2"
                    unoptimized={!isOptimizableRemoteImage(business.lankaqrImageUrl)}
                  />
                </div>
              )}
            </div>
          )}
          {upsell && (
            <div className="mb-3 rounded-xl border border-blue-100 booking-bg-accent-muted/70 p-4 text-sm md:mb-4">
              <p className="font-medium text-blue-950 dark:text-blue-100">Recommended add-on</p>
              <p className="mt-1 booking-text-accent/80">
                {upsell.reason} Ask about <span className="font-semibold">{upsell.name}</span>
                {upsell.priceLkr > 0 ? ` (${formatLkr(upsell.priceLkr)})` : ""} during your visit.
              </p>
            </div>
          )}
          {onlineMethods.length > 1 && service?.requiresPayment && dueNow > 0 && (
            <div className="mb-3 space-y-2 rounded-xl border border-gray-100 bg-white p-4 md:mb-4">
              <p className="text-sm font-medium text-gray-900">{copy.paymentMethod}</p>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "payhere"}
                  onChange={() => setPaymentMethod("payhere")}
                />
                {copy.paymentMethodPayhere}
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "paypal"}
                  onChange={() => setPaymentMethod("paypal")}
                />
                {copy.paymentMethodPaypal}
              </label>
            </div>
          )}
          {contactForm}
        </div>
      </div>

      {error && (
        <div className="mx-[14px] mb-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-3 py-2.5 text-sm text-red-700 dark:text-red-300 md:mx-0">
          <Icon name="exclamation-circle" className="mt-0.5 shrink-0 text-sm" />
          <span>{error}</span>
        </div>
      )}

      {/* Mobile pinned CTA */}
      <div className="sticky bottom-0 z-10 border-t border-gray-200 dark:border-neutral-800/80 booking-sticky-bar px-[14px] pb-[max(1rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md md:relative md:mt-6 md:border-0 md:bg-transparent md:px-0 md:pb-0 md:pt-0">
        <div className="mb-2 flex md:mb-4">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 md:mr-4"
          >
            <Icon name="chevron-left" className="text-sm" /> {copy.back}
          </button>
        </div>
        <button
          type="button"
          onClick={handleBook}
          disabled={loading || !state.clientName || !state.clientPhone}
          className="w-full rounded-[14px] bg-gradient-to-r booking-gradient-accent py-[17px] text-[16px] font-bold text-white shadow-lg booking-shadow-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:rounded-xl md:py-3.5 md:text-sm md:font-semibold"
        >
          {loading ? "Booking…" : payLabel}
        </button>
        <div className="mt-2 flex items-center justify-center gap-1 md:mt-3">
          <Icon name="shield-check" className="text-[11px] text-gray-300" />
          <span className="text-[11px] text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">{copy.paymentSecure}</span>
        </div>
      </div>
    </div>
  );
}
