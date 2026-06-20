"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { format, parseISO } from "date-fns";
import type { BookingBusiness, BookingState } from "./BookingWizard";
import { formatLkr, isOptimizableRemoteImage } from "@/lib/utils";
import type { BookingCopy } from "@/lib/i18n";
import { readStoredAttribution } from "@/lib/booking-attribution";
import { getBookingSessionToken } from "@/lib/booking-session";
import { computeAmountDueFromDiscountedPrice, computeDiscountedPrice } from "@/lib/deals/pricing";
import { trackBookingComplete, trackDealBookingComplete, trackDealBookingStart } from "@/lib/analytics/gtag";
import {
  getAvailablePaymentMethods,
  resolveDefaultPaymentMethod,
} from "@/lib/payments/resolve";
import type { DealListItem } from "@/lib/deals/queries";
import { Icon } from "@/components/ui/Icon";
import { BookingSubmitButton } from "./BookingSubmitButton";
import {
  validateConfirmFields,
  type ConfirmFieldErrors,
} from "./booking-confirm-validation";
import type { IntakeQuestion } from "@/lib/intake";

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
  variant?: "inline" | "full";
  formId?: string;
}

const fieldBaseCls =
  "mt-1.5 w-full min-h-11 rounded-xl border px-3 py-2.5 text-base transition-shadow placeholder:text-muted-foreground focus:outline-none focus:ring-2 md:text-sm";
const fieldOkCls = `${fieldBaseCls} border-border bg-card focus:border-[var(--booking-accent)] focus:ring-[var(--booking-accent-soft)]`;
const fieldErrCls = `${fieldBaseCls} border-destructive/50 bg-destructive/5 focus:border-destructive focus:ring-destructive/20`;

function fieldErrorId(field: string) {
  return `confirm-error-${field}`;
}

function IntakeField({
  question,
  value,
  error,
  copy,
  onChange,
}: {
  question: IntakeQuestion;
  value: string;
  error?: string;
  copy: BookingCopy;
  onChange: (value: string) => void;
}) {
  const id = `intake-${question.id}`;
  const errorId = fieldErrorId(`intake-${question.id}`);
  const cls = error ? fieldErrCls : fieldOkCls;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {question.label}{" "}
        {question.required ? (
          <span className="font-normal text-gray-400 dark:text-gray-500">*</span>
        ) : (
          <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
        )}
      </label>
      {question.sensitive ? (
        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{copy.intakePrivacy}</p>
      ) : null}
      {question.type === "textarea" ? (
        <textarea
          id={id}
          value={value}
          rows={2}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={`${cls} resize-none`}
        />
      ) : question.type === "select" ? (
        <select
          id={id}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        >
          <option value="">Choose an option…</option>
          {(question.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      ) : question.type === "boolean" ? (
        <select
          id={id}
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        >
          <option value="">Choose yes or no…</option>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      ) : (
        <input
          id={id}
          type="text"
          value={value}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
        />
      )}
      {error ? (
        <p id={errorId} className="mt-1 text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default function StepConfirm({
  state,
  business,
  copy,
  selectedDeal,
  sessionToken,
  onUpdate,
  onBack,
  onConfirmed,
  variant = "full",
  formId = "booking-contact-form",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<ConfirmFieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [upsell, setUpsell] = useState<{
    name: string;
    priceLkr: number;
    reason: string;
  } | null>(null);

  const service = state.service;
  const intakeQuestions = useMemo(
    () => service?.intakeQuestions ?? [],
    [service?.intakeQuestions],
  );

  const validationMessages = useMemo(
    () => ({
      nameRequired: copy.fieldRequired,
      phoneRequired: copy.fieldRequired,
      phoneInvalid: copy.invalidPhone,
      emailInvalid: copy.invalidEmail,
      intakeRequired: (label: string) => `${copy.fieldRequired}: ${label}`,
    }),
    [copy],
  );

  const liveValidation = useMemo(
    () =>
      validateConfirmFields({
        clientName: state.clientName,
        clientPhone: state.clientPhone,
        clientEmail: state.clientEmail,
        intakeQuestions,
        intakeAnswers: state.intakeAnswers,
        messages: validationMessages,
      }),
    [
      state.clientName,
      state.clientPhone,
      state.clientEmail,
      state.intakeAnswers,
      intakeQuestions,
      validationMessages,
    ],
  );

  const discountedPrice =
    service && selectedDeal
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
      (business.bankTransferInstructions || business.lankaqrImageUrl),
  );

  const payLabel =
    service?.requiresPayment && !hasManualPaymentFallback && dueNow > 0
      ? `${copy.confirmAndPay} — ${formatLkr(dueNow)}`
      : copy.confirmBooking;

  const canSubmit = liveValidation.valid && !loading;

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

  function markTouched(key: string) {
    setTouched((prev) => ({ ...prev, [key]: true }));
  }

  function showFieldError(key: keyof ConfirmFieldErrors) {
    if (!touched[key] && !fieldErrors[key]) return undefined;
    return liveValidation.errors[key] as string | undefined;
  }

  async function handleBook() {
    const result = validateConfirmFields({
      clientName: state.clientName,
      clientPhone: state.clientPhone,
      clientEmail: state.clientEmail,
      intakeQuestions,
      intakeAnswers: state.intakeAnswers,
      messages: validationMessages,
    });

    setFieldErrors(result.errors);
    setTouched({
      clientName: true,
      clientPhone: true,
      clientEmail: true,
      ...Object.fromEntries(intakeQuestions.map((q) => [`intake-${q.id}`, true])),
    });

    if (!result.valid) {
      setError(result.firstError ?? copy.fieldRequired);
      return;
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
        clientName: state.clientName.trim(),
        clientPhone: state.clientPhone.trim(),
        clientEmail: state.clientEmail.trim(),
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

    trackBookingComplete({
      businessSlug: business.slug,
      serviceId: state.service?.id,
      bookingId: data.bookingId,
      amountLkr: discountedPrice,
      isDeal: Boolean(selectedDeal),
      requiresPayment: Boolean(service?.requiresPayment),
    });

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
      <div className="rounded-xl border border-border bg-card p-4">
        <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {copy.appointment}
        </p>
        <p className="text-xl font-semibold tabular-nums text-foreground">{state.timeLabel}</p>
        <p className="mt-1 text-sm text-muted-foreground">{dateLabel}</p>
        {yearLabel ? <p className="text-xs text-muted-foreground">{yearLabel}</p> : null}
        <p className="mt-3 text-sm text-foreground">
          {service?.name}
          {state.staff ? <span className="text-muted-foreground"> · {state.staff.name}</span> : null}
        </p>
      </div>

      {service && service.priceLkr > 0 && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{copy.fullAmount}</p>
            <p className="text-base font-semibold tabular-nums text-foreground">
              {selectedDeal ? (
                <>
                  <span className="mr-2 text-sm font-normal text-muted-foreground line-through">
                    {formatLkr(service.priceLkr)}
                  </span>
                  {formatLkr(discountedPrice)}
                </>
              ) : (
                formatLkr(service.priceLkr)
              )}
            </p>
          </div>
          {service.requiresPayment && service.depositPercent > 0 && (
            <div className="mt-2 flex items-center justify-between text-sm">
              <p className="text-muted-foreground">
                {copy.depositDue} ({service.depositPercent}%)
              </p>
              <p className="font-medium tabular-nums booking-text-accent">{formatLkr(depositAmount)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const nameError = showFieldError("clientName");
  const phoneError = showFieldError("clientPhone");
  const emailError = showFieldError("clientEmail");

  const contactForm = (
    <div className="space-y-3 md:rounded-xl md:border md:border-border md:bg-card md:p-5">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground md:mb-1">
        {copy.details}
      </p>
      <div>
        <label htmlFor="clientName" className="text-sm font-medium text-foreground">
          Full name <span className="font-normal text-gray-400 dark:text-gray-500">*</span>
        </label>
        <input
          id="clientName"
          name="name"
          required
          type="text"
          autoComplete="name"
          value={state.clientName}
          aria-invalid={Boolean(nameError)}
          aria-describedby={nameError ? fieldErrorId("clientName") : undefined}
          onBlur={() => markTouched("clientName")}
          onChange={(e) => onUpdate({ clientName: e.target.value })}
          className={nameError ? fieldErrCls : fieldOkCls}
          placeholder="Nimal Perera"
        />
        {nameError ? (
          <p id={fieldErrorId("clientName")} className="mt-1 text-xs text-red-600 dark:text-red-400">
            {nameError}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="clientPhone" className="text-sm font-medium text-foreground">
          Phone number <span className="font-normal text-gray-400 dark:text-gray-500">*</span>
        </label>
        <input
          id="clientPhone"
          name="tel"
          required
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={state.clientPhone}
          aria-invalid={Boolean(phoneError)}
          aria-describedby={phoneError ? fieldErrorId("clientPhone") : undefined}
          onBlur={() => markTouched("clientPhone")}
          onChange={(e) => onUpdate({ clientPhone: e.target.value })}
          className={phoneError ? fieldErrCls : fieldOkCls}
          placeholder="+94 77 123 4567"
        />
        {phoneError ? (
          <p id={fieldErrorId("clientPhone")} className="mt-1 text-xs text-red-600 dark:text-red-400">
            {phoneError}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="clientEmail" className="text-sm font-medium text-foreground">
          Email <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
        </label>
        <input
          id="clientEmail"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={state.clientEmail}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? fieldErrorId("clientEmail") : undefined}
          onBlur={() => markTouched("clientEmail")}
          onChange={(e) => onUpdate({ clientEmail: e.target.value })}
          className={emailError ? fieldErrCls : fieldOkCls}
          placeholder="you@email.com"
        />
        {emailError ? (
          <p id={fieldErrorId("clientEmail")} className="mt-1 text-xs text-red-600 dark:text-red-400">
            {emailError}
          </p>
        ) : null}
      </div>
      <div>
        <label htmlFor="notes" className="text-sm font-medium text-foreground">
          Notes <span className="text-xs font-normal text-gray-400 dark:text-gray-500">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          value={state.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          className={`${fieldOkCls} resize-none`}
          rows={2}
          placeholder={
            hasManualPaymentFallback ? copy.paymentReference : "Anything we should know?"
          }
        />
      </div>

      {intakeQuestions.length > 0 && (
        <div className="space-y-3 border-t border-gray-100 dark:border-neutral-800 pt-4">
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{copy.intakeSection}</p>
            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{copy.intakePrivacy}</p>
          </div>
          {intakeQuestions.map((q) => (
            <IntakeField
              key={q.id}
              question={q}
              value={state.intakeAnswers[q.id] ?? ""}
              error={
                touched[`intake-${q.id}`] || fieldErrors.intake?.[q.id]
                  ? liveValidation.errors.intake?.[q.id]
                  : undefined
              }
              copy={copy}
              onChange={(v) => {
                markTouched(`intake-${q.id}`);
                onUpdate({ intakeAnswers: { ...state.intakeAnswers, [q.id]: v } });
              }}
            />
          ))}
        </div>
      )}
    </div>
  );

  const paymentExtras = (
    <>
      {hasManualPaymentFallback && (
        <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800/50 dark:bg-amber-950/40 md:mb-4">
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
                className="h-36 w-36 rounded-lg border bg-white object-contain p-2 dark:border-neutral-800 dark:bg-neutral-900"
                unoptimized={!isOptimizableRemoteImage(business.lankaqrImageUrl)}
              />
            </div>
          )}
        </div>
      )}
      {upsell && (
        <div className="mb-3 rounded-xl border border-blue-100 bg-[var(--booking-accent-muted)]/70 p-4 text-sm md:mb-4">
          <p className="font-medium text-blue-950 dark:text-blue-100">Recommended add-on</p>
          <p className="mt-1 text-[var(--booking-accent)]/80">
            {upsell.reason} Ask about <span className="font-semibold">{upsell.name}</span>
            {upsell.priceLkr > 0 ? ` (${formatLkr(upsell.priceLkr)})` : ""} during your visit.
          </p>
        </div>
      )}
      {onlineMethods.length > 1 && service?.requiresPayment && dueNow > 0 && (
        <div className="mb-3 space-y-2 rounded-xl border border-border bg-card p-4 md:mb-4">
          <p className="text-sm font-medium text-foreground">{copy.paymentMethod}</p>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
            <input
              type="radio"
              name="paymentMethod"
              checked={paymentMethod === "payhere"}
              onChange={() => setPaymentMethod("payhere")}
            />
            {copy.paymentMethodPayhere}
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
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
    </>
  );

  if (variant === "inline") {
    return (
      <div id={formId} className="pt-2">
        {paymentExtras}
        {contactForm}
        {error && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <Icon name="exclamation-circle" className="mt-0.5 shrink-0 text-sm" />
            <span>{error}</span>
          </div>
        )}
        <BookingSubmitButton
          className="mt-4"
          loading={loading}
          disabled={!canSubmit}
          onClick={handleBook}
        >
          {payLabel}
        </BookingSubmitButton>
        <button
          type="button"
          onClick={onBack}
          className="mt-3 flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          {copy.back}
        </button>
        <div className="mt-3 flex items-center justify-center gap-1">
          <Icon name="shield-check" className="text-[11px] text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{copy.paymentSecure}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-3 booking-panel-bg px-[14px] py-3 md:grid md:grid-cols-2 md:gap-8 md:bg-transparent md:px-8 md:py-7">
        <div>{summaryCards}</div>
        <div>
          {paymentExtras}
          {contactForm}
        </div>
      </div>

      {error && (
        <div className="mx-[14px] mb-2 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40 px-3 py-2.5 text-sm text-red-700 dark:text-red-300 md:mx-8">
          <Icon name="exclamation-circle" className="mt-0.5 shrink-0 text-sm" />
          <span>{error}</span>
        </div>
      )}

      <div className="sticky bottom-0 z-10 border-t border-border booking-sticky-bar px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md md:relative md:mt-6 md:border-0 md:bg-transparent md:px-8 md:pb-0 md:pt-0">
        <button
          type="button"
          onClick={onBack}
          className="mb-3 flex min-h-11 items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <Icon name="chevron-left" className="text-sm" /> {copy.back}
        </button>
        <BookingSubmitButton loading={loading} disabled={!canSubmit} onClick={handleBook}>
          {payLabel}
        </BookingSubmitButton>
        <div className="mt-2 flex items-center justify-center gap-1 md:mt-3">
          <Icon name="shield-check" className="text-[11px] text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground">{copy.paymentSecure}</span>
        </div>
      </div>
    </div>
  );
}
