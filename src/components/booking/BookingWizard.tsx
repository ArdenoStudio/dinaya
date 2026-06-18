"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { Icon } from "@/components/ui/Icon";
import type { Location, Staff } from "@/db/schema";
import type { IntakeQuestion } from "@/lib/intake";
import type { BookingRouter } from "@/lib/booking-router";
import StepService from "./StepService";
import StepLocation from "./StepLocation";
import StepDateTime from "./StepDateTime";
import StepConfirm from "./StepConfirm";
import StaffPicker from "./StaffPicker";
import BookingDesktopSummary from "./BookingDesktopSummary";
import { BookingTheme } from "./BookingTheme";
import { useBookingUrlState, useBookingUrlSync, useStripBookingContactFromUrl } from "./useBookingUrlState";
import { useSlotHold } from "./useSlotHold";
import { getBookingCopy } from "@/lib/i18n";
import { getEligibleStaff, pickDefaultStaff } from "@/lib/booking-staff";
import { formatLkr } from "@/lib/utils";
import { trackBookingStart } from "@/lib/analytics/gtag";
import { BusinessAvatar } from "./BusinessAvatar";
import BookingBranding from "./BookingBranding";
import { BookingAttributionCapture } from "./BookingAttributionCapture";
import { BookingDealsSection } from "./BookingDealsSection";
import type { DealListItem } from "@/lib/deals/queries";
import { computeDiscountedPrice } from "@/lib/deals/pricing";
import {
  indexToStep,
  stepToIndex,
  type BookingStep,
} from "./booking-steps";
import { useBookingContactStorage } from "./useBookingContactStorage";
import BookingStepTransition from "./BookingStepTransition";
import { applyEmbedThemeFromQuery, postEmbedEvent } from "./embed-events";
import {
  useGoogleCalendarOverlay,
  type CalendarOverlayConfig,
} from "./useGoogleCalendarOverlay";

const COLOMBO_TZ = "Asia/Colombo";

interface Props {
  business: BookingBusiness;
  services: BookingService[];
  staff: Staff[];
  staffServiceMap: { staffId: string; serviceId: string }[];
  staffLocationMap: { staffId: string; locationId: string }[];
  locations: Pick<Location, "id" | "name" | "address">[];
  bookingUrlLabel: string;
  businessIcon?: string | null;
  showBranding?: boolean;
  activeDeals?: DealListItem[];
  initialDealId?: string | null;
  bookingRouter?: BookingRouter | null;
  initialService?: BookingService | null;
  lockServiceSelection?: boolean;
  embedMode?: boolean;
  calendarOverlayConfig?: CalendarOverlayConfig | null;
}

export type BookingBusiness = {
  id: string;
  accentColor?: string | null;
  timezone?: string | null;
  bankTransferInstructions?: string | null;
  cancellationPolicy?: string | null;
  depositPolicy?: string | null;
  language?: string;
  lankaqrImageUrl?: string | null;
  name: string;
  payhereEnabled?: boolean;
  paypalEnabled?: boolean;
  slug: string;
  logoUrl?: string | null;
  hideBranding?: boolean;
};

export type BookingService = {
  id: string;
  slug?: string;
  imageUrl?: string | null;
  afterBuffer: number;
  beforeBuffer: number;
  businessId: string;
  createdAt: Date;
  dailyCapacity: number | null;
  description: string | null;
  durationMinutes: number;
  isActive: boolean;
  minimumNoticeHours: number;
  maximumAdvanceDays: number | null;
  name: string;
  priceLkr: number;
  requiresPayment: boolean;
  depositPercent: number;
  intakeQuestions: IntakeQuestion[];
};

export type BookingState = {
  location: Pick<Location, "id" | "name" | "address"> | null;
  service: BookingService | null;
  staff: Staff | null;
  date: string;
  timeSlot: string;
  timeSlotEnd: string;
  timeLabel: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
  intakeAnswers: Record<string, string>;
};

type SlotData = { startUtc: string; endUtc: string; label: string; staffId?: string };

function BookingWizardInner({
  business,
  services,
  staff,
  staffServiceMap,
  staffLocationMap,
  locations,
  bookingUrlLabel,
  businessIcon,
  showBranding = true,
  activeDeals = [],
  initialDealId = null,
  bookingRouter = null,
  initialService = null,
  lockServiceSelection = false,
  embedMode = false,
  calendarOverlayConfig = null,
}: Props) {
  const copy = getBookingCopy(business.language);
  const router = useRouter();
  const timezone = business.timezone ?? COLOMBO_TZ;
  const { state: urlState } = useBookingUrlState();
  const needsLocationPicker = locations.length > 1;
  const progressSteps = [copy.service, copy.dateTime, copy.confirm];

  const initialStep: BookingStep = initialService ? "dateTime" : "service";
  const [step, setStep] = useState<BookingStep>(initialStep);
  const stepIndex = stepToIndex(step);
  const defaultLocation = locations.length === 1 ? locations[0]! : null;
  const todayStr = format(toZonedTime(new Date(), timezone), "yyyy-MM-dd");

  const [state, setState] = useState<BookingState>(() => {
    const preselected = initialService ?? null;
    const preStaff = preselected
      ? pickDefaultStaff(staff, staffServiceMap, preselected.id, staffLocationMap, defaultLocation?.id)
      : null;
    const matchedStaff = urlState.staffId
      ? staff.find((s) => s.id === urlState.staffId) ?? preStaff
      : preStaff;

    return {
      location: defaultLocation,
      service: preselected,
      staff: matchedStaff,
      date: urlState.date || todayStr,
      timeSlot: urlState.slot || "",
      timeSlotEnd: "",
      timeLabel: "",
      clientName: urlState.name || "",
      clientPhone: urlState.phone || "",
      clientEmail: urlState.email || "",
      notes: "",
      intakeAnswers: {},
    };
  });

  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(() =>
    urlState.slot ? { startUtc: urlState.slot, endUtc: "", label: "" } : null,
  );
  const [selectedDealId, setSelectedDealId] = useState<string | null>(
    initialDealId ?? urlState.dealId ?? null,
  );

  const [anyStaff, setAnyStaff] = useState(false);
  const [calendarViewMonth, setCalendarViewMonth] = useState(() =>
    format(toZonedTime(new Date(), timezone), "yyyy-MM"),
  );
  const calendarOverlay = useGoogleCalendarOverlay({
    config: embedMode ? null : calendarOverlayConfig,
    selectedDate: state.date,
    viewMonth: calendarViewMonth,
    timezone,
  });

  const slotHold = useSlotHold({
    businessId: business.id,
    serviceId: state.service?.id ?? null,
    staffId: state.staff?.id ?? null,
    enabled: true,
  });

  useBookingUrlSync({
    date: state.date,
    slotStartUtc: state.timeSlot,
    staffId: state.staff?.id ?? null,
    dealId: selectedDealId,
    enabled: !embedMode,
  });

  useStripBookingContactFromUrl();

  useEffect(() => {
    if (!embedMode) return;
    applyEmbedThemeFromQuery();
    postEmbedEvent({ type: "dinaya:ready", slug: business.slug });
  }, [business.slug, embedMode]);

  useEffect(() => {
    if (!embedMode || !state.service) return;
    postEmbedEvent({
      type: "dinaya:booking_started",
      slug: business.slug,
      serviceId: state.service.id,
    });
  }, [business.slug, embedMode, state.service]);

  const selectedDeal = useMemo(
    () => activeDeals.find((deal) => deal.id === selectedDealId) ?? null,
    [activeDeals, selectedDealId],
  );

  const handleConfirmed = useCallback(
    (data: {
      bookingId: string;
      manualPayment?: boolean;
      payhereFormData?: Record<string, string>;
      payhereUrl?: string;
      approvalUrl?: string;
      provider?: string;
      status?: string;
    }) => {
      void slotHold.releaseHold();
      if (data.payhereUrl || data.approvalUrl || data.provider === "paypal" || data.provider === "payhere") {
        router.push(`/book/${business.slug}/pay?bookingId=${data.bookingId}`);
        return;
      }
      if (embedMode) {
        postEmbedEvent({
          type: "dinaya:booking_completed",
          slug: business.slug,
          bookingId: data.bookingId,
          status: data.status,
        });
      }
      router.push(`/book/${business.slug}/confirmed?bookingId=${data.bookingId}`);
    },
    [business.slug, router, slotHold, embedMode],
  );

  const bookingStartedRef = useRef(false);
  const markBookingStart = useCallback(
    (isDeal: boolean, serviceId?: string) => {
      if (bookingStartedRef.current) return;
      bookingStartedRef.current = true;
      trackBookingStart({ businessSlug: business.slug, serviceId, isDeal });
    },
    [business.slug],
  );

  const needsStaffPicker = useMemo(() => {
    if (!state.service) return false;
    return getEligibleStaff(staff, staffServiceMap, state.service.id, staffLocationMap, state.location?.id).length > 1;
  }, [state.service, state.location?.id, staff, staffServiceMap, staffLocationMap]);

  function update(partial: Partial<BookingState>) {
    setState((s) => ({ ...s, ...partial }));
  }

  const contactFields = useMemo(
    () => ({
      clientName: state.clientName,
      clientPhone: state.clientPhone,
      clientEmail: state.clientEmail,
    }),
    [state.clientName, state.clientPhone, state.clientEmail],
  );

  useBookingContactStorage(business.id, contactFields, (restored) => {
    update({
      clientName: restored.clientName ?? state.clientName,
      clientPhone: restored.clientPhone ?? state.clientPhone,
      clientEmail: restored.clientEmail ?? state.clientEmail,
    });
  });

  const selectSlot = useCallback(
    async (slot: SlotData) => {
      const holdSlot = { ...slot, staffId: slot.staffId ?? state.staff?.id };
      const ok = await slotHold.reserveSlot(holdSlot);
      if (!ok) {
        setSelectedSlot(null);
        setState((s) => ({ ...s, timeSlot: "", timeSlotEnd: "", timeLabel: "" }));
        return;
      }
      const assignedStaff =
        slot.staffId ? staff.find((member) => member.id === slot.staffId) ?? state.staff : state.staff;
      setSelectedSlot(slot);
      setAnyStaff(false);
      setState((s) => ({
        ...s,
        staff: assignedStaff ?? s.staff,
        timeSlot: slot.startUtc,
        timeSlotEnd: slot.endUtc,
        timeLabel: slot.label,
      }));
    },
    [slotHold, staff, state.staff],
  );

  const selectService = useCallback(
    (service: BookingService) => {
      markBookingStart(false, service.id);
      const defaultStaff = pickDefaultStaff(staff, staffServiceMap, service.id, staffLocationMap, state.location?.id);
      update({
        service,
        staff: defaultStaff,
        date: todayStr,
        timeSlot: "",
        timeSlotEnd: "",
        timeLabel: "",
      });
      setSelectedSlot(null);
      setAnyStaff(false);
      void slotHold.releaseHold();
      setSelectedDealId(null);
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setStep("dateTime");
      }
    },
    [staff, staffServiceMap, staffLocationMap, state.location?.id, todayStr, slotHold, markBookingStart],
  );

  const applyDeal = useCallback(
    (deal: DealListItem | null) => {
      setSelectedDealId(deal?.id ?? null);
      if (!deal) return;
      markBookingStart(true, deal.serviceId);

      const service = services.find((item) => item.id === deal.serviceId) ?? null;
      const location = locations.find((item) => item.id === deal.locationId) ?? state.location;
      const eligibleStaff = service
        ? getEligibleStaff(staff, staffServiceMap, service.id, staffLocationMap, location?.id)
        : [];
      const dealStaff = deal.staffId
        ? eligibleStaff.find((member) => member.id === deal.staffId) ?? null
        : pickDefaultStaff(staff, staffServiceMap, deal.serviceId, staffLocationMap, location?.id);

      update({
        location: location ?? null,
        service,
        staff: dealStaff,
        date: todayStr,
        timeSlot: "",
        timeSlotEnd: "",
        timeLabel: "",
      });
      setSelectedSlot(null);
      setAnyStaff(false);
      void slotHold.releaseHold();
      if (typeof window !== "undefined" && window.innerWidth < 768) {
        setStep("dateTime");
      }
    },
    [locations, services, staff, staffServiceMap, staffLocationMap, state.location, todayStr, slotHold, markBookingStart],
  );

  useEffect(() => {
    if (!initialDealId || activeDeals.length === 0) return;
    const deal = activeDeals.find((item) => item.id === initialDealId);
    if (deal) applyDeal(deal);
  }, [initialDealId, activeDeals, applyDeal]);

  function goConfirm() {
    if (!state.service || !selectedSlot || (!state.staff && !anyStaff)) return;
    if (!state.staff) return;
    if (needsLocationPicker && !state.location) return;
    if (slotHold.slotUnavailable) return;
    setStep("confirm");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const canProceedDesktop =
    Boolean(
      state.service &&
        selectedSlot &&
        state.staff &&
        (!needsLocationPicker || state.location),
    ) &&
    step !== "confirm" &&
    !slotHold.slotUnavailable;

  const depositPreview = state.service
    ? selectedDeal
      ? computeDiscountedPrice(state.service.priceLkr, selectedDeal.discountPercent)
      : state.service.depositPercent > 0
        ? Math.ceil((state.service.priceLkr * state.service.depositPercent) / 100)
        : state.service.priceLkr
    : 0;

  const desktopPayCta =
    state.service?.requiresPayment && depositPreview > 0
      ? `${copy.confirmAndPay} — ${formatLkr(depositPreview)}`
      : copy.confirmAndPay;

  const desktopSelectionLine = [
    state.service?.name,
    state.date && state.timeLabel
      ? `${format(parseISO(state.date + "T12:00:00"), "d MMM")} · ${state.timeLabel}`
      : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <BookingTheme accentColor={business.accentColor} embed={embedMode}>
      <div className="min-w-0 md:overflow-hidden md:rounded-2xl md:border md:border-gray-100 dark:border-neutral-800/80 md:bg-white dark:md:bg-neutral-900 md:shadow-[0_24px_64px_-12px_var(--booking-accent-shadow),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
        <BookingAttributionCapture businessId={business.id} />
        <BookingDealsSection
          deals={activeDeals}
          selectedDealId={selectedDealId}
          onSelectDeal={applyDeal}
        />

        <div className="booking-bg-accent px-[18px] pt-5 pb-[18px] md:hidden">
          <BusinessIdentity
            name={business.name}
            urlLabel={bookingUrlLabel}
            logoUrl={business.logoUrl}
            icon={businessIcon}
          />
          <ProgressPills steps={progressSteps} current={stepIndex} />
        </div>

        <div className="hidden booking-bg-accent md:block">
          <div className="px-8 pb-6 pt-7">
            <div className="flex items-center gap-4">
              <BusinessAvatar
                name={business.name}
                logoUrl={business.logoUrl}
                icon={businessIcon}
                size="lg"
                onDark
              />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider booking-text-accent-on-dark/90">
                  {copy.bookAppointment}
                </p>
                <h2 className="mt-0.5 text-xl font-semibold tracking-tight text-white">
                  {state.service?.name ?? business.name}
                </h2>
                {state.service && (
                  <p className="mt-0.5 text-sm text-white/70">{business.name}</p>
                )}
              </div>
              <span className="flex shrink-0 items-center gap-1.5 font-mono text-xs booking-text-accent-on-dark/80">
                <Icon name="lock-fill" className="text-[10px] booking-text-accent-on-dark" />
                {bookingUrlLabel}
              </span>
            </div>
            <div className="mt-6 border-t border-white/10 pt-5">
              <DesktopProgressBar
                steps={progressSteps}
                current={stepIndex}
                variant="dark"
                onStepClick={(i) => {
                  const target = indexToStep(i);
                  if (i < stepIndex) setStep(target);
                }}
              />
            </div>
          </div>
        </div>

        <BookingStepTransition step={step}>
        {step !== "confirm" && (
          <>
            <div className="md:px-8 md:py-7">
              <div className="grid gap-0 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] md:gap-8 lg:gap-10">
                <div className="border-b border-gray-100 dark:border-neutral-800 p-[14px] md:flex md:flex-col md:border-0 md:p-0">
                  {needsLocationPicker && (
                    <StepLocation
                      locations={locations}
                      selected={state.location}
                      copy={copy}
                      onSelect={(location) => {
                        update({
                          location,
                          service: lockServiceSelection ? state.service : null,
                          staff: null,
                          timeSlot: "",
                          timeSlotEnd: "",
                          timeLabel: "",
                        });
                        setSelectedSlot(null);
                        void slotHold.releaseHold();
                      }}
                    />
                  )}

                  {!lockServiceSelection && (
                    <StepService
                      services={services}
                      selected={state.service}
                      copy={copy}
                      bookingRouter={bookingRouter}
                      onSelect={selectService}
                    />
                  )}

                  {lockServiceSelection && state.service && (
                    <div className="mb-5 rounded-xl border border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/60 p-4">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
                        {copy.service}
                      </p>
                      <p className="mt-1 text-base font-semibold text-gray-900 dark:text-gray-100">{state.service.name}</p>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        {state.service.durationMinutes} min
                        {state.service.priceLkr > 0 ? ` · ${formatLkr(state.service.priceLkr)}` : ""}
                      </p>
                    </div>
                  )}

                  {state.service && needsStaffPicker && (
                    <StaffPicker
                      allStaff={staff}
                      staffServiceMap={staffServiceMap}
                      staffLocationMap={staffLocationMap}
                      locationId={state.location?.id}
                      serviceId={state.service.id}
                      selected={state.staff}
                      anyStaffSelected={anyStaff}
                      copy={copy}
                      onSelect={(s) => {
                        setAnyStaff(false);
                        update({ staff: s, timeSlot: "", timeSlotEnd: "", timeLabel: "" });
                        setSelectedSlot(null);
                        void slotHold.releaseHold();
                      }}
                      onSelectAny={() => {
                        setAnyStaff(true);
                        update({ staff: null, timeSlot: "", timeSlotEnd: "", timeLabel: "" });
                        setSelectedSlot(null);
                        void slotHold.releaseHold();
                      }}
                      compact
                    />
                  )}

                  {state.service && !state.staff && !anyStaff && !needsStaffPicker && (
                    <p className="mt-3 text-center text-sm text-amber-600">{copy.noStaff}</p>
                  )}

                  <div className="hidden md:block">
                    <BookingDesktopSummary
                      copy={copy}
                      service={state.service}
                      staff={state.staff}
                      anyStaff={anyStaff}
                      date={state.date}
                      timeLabel={state.timeLabel}
                      holdLabel={slotHold.holdLabel}
                      selectedDeal={selectedDeal}
                    />
                  </div>
                </div>

                <div className="min-w-0 booking-panel-bg p-[14px] md:flex md:flex-col md:rounded-2xl md:border md:border-gray-100 dark:border-neutral-800 md:bg-gray-50 dark:md:bg-neutral-900/60 md:p-5">
                  <StepDateTime
                    businessId={business.id}
                    copy={copy}
                    service={state.service}
                    staff={state.staff}
                    anyStaff={anyStaff}
                    locationId={state.location?.id}
                    timezone={timezone}
                    selectedDate={state.date}
                    selectedSlot={selectedSlot}
                    dealId={selectedDealId}
                    holdLabel={slotHold.holdLabel}
                    slotUnavailable={slotHold.slotUnavailable}
                    onDateChange={(date) => {
                      update({ date, timeSlot: "", timeSlotEnd: "", timeLabel: "" });
                      setSelectedSlot(null);
                      void slotHold.releaseHold();
                    }}
                    onSlotSelect={selectSlot}
                    showContinue={step === "dateTime"}
                    onContinue={goConfirm}
                    onBack={() => setStep(lockServiceSelection ? "dateTime" : "service")}
                    onCalendarMonthChange={setCalendarViewMonth}
                    calendarOverlay={calendarOverlay}
                  />
                </div>
              </div>
            </div>

            <div className="hidden border-t border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/60 px-8 py-5 md:flex md:items-center md:gap-6">
              <div className="min-w-0 flex-1">
                {desktopSelectionLine ? (
                  <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300">{desktopSelectionLine}</p>
                ) : (
                  <p className="text-sm text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">{copy.selectServiceHint}</p>
                )}
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">{copy.securedByPayHere}</p>
              </div>
              <button
                type="button"
                onClick={goConfirm}
                disabled={!canProceedDesktop || slotHold.holding}
                className="shrink-0 rounded-xl booking-gradient-accent px-8 py-3.5 text-sm font-semibold text-white booking-shadow-accent transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {desktopPayCta}
              </button>
            </div>
          </>
        )}

        {step === "confirm" && (
          <StepConfirm
            state={state}
            business={business}
            copy={copy}
            selectedDeal={selectedDeal}
            sessionToken={slotHold.sessionToken}
            onUpdate={update}
            onBack={() => setStep("dateTime")}
            onConfirmed={handleConfirmed}
          />
        )}
        </BookingStepTransition>

        {showBranding && <BookingBranding copy={copy} hideBranding={business.hideBranding} />}
      </div>
    </BookingTheme>
  );
}

export default function BookingWizard(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-[320px] animate-pulse rounded-2xl bg-gray-100 dark:bg-neutral-800" />}>
      <BookingWizardInner {...props} />
    </Suspense>
  );
}

function DesktopProgressBar({
  steps,
  current,
  variant = "light",
  onStepClick,
}: {
  steps: string[];
  current: number;
  variant?: "light" | "dark";
  onStepClick?: (index: number) => void;
}) {
  const dark = variant === "dark";

  return (
    <ol className="flex w-full items-center">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const canNavigate = done && onStepClick;

        const stepControl = (
          <>
            <span
              className={`flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                dark
                  ? active
                    ? "bg-white booking-text-accent shadow-lg shadow-black/10"
                    : done
                      ? "bg-white/25 text-white"
                      : "bg-white/10 text-white/50 ring-1 ring-white/20"
                  : active
                    ? "booking-bg-accent text-white booking-shadow-accent"
                    : done
                      ? "booking-bg-accent text-white"
                      : "bg-white dark:bg-neutral-900 text-gray-400 dark:text-gray-500 ring-1 ring-gray-200 dark:ring-neutral-700"
              }`}
            >
              {done ? <Icon name="check-lg" className="text-xs" /> : i + 1}
            </span>
            <span
              className={`whitespace-nowrap text-sm font-semibold ${
                dark
                  ? active
                    ? "text-white"
                    : done
                      ? "text-white/90"
                      : "text-white/45"
                  : active
                    ? "text-gray-900 dark:text-gray-100"
                    : done
                      ? "booking-text-accent"
                      : "text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500"
              }`}
            >
              {label}
            </span>
          </>
        );

        return (
          <li key={label} className={`flex items-center ${i < steps.length - 1 ? "flex-1" : ""}`}>
            {canNavigate ? (
              <button
                type="button"
                onClick={() => onStepClick(i)}
                className="flex items-center gap-3 rounded-lg transition-opacity hover:opacity-90"
              >
                {stepControl}
              </button>
            ) : (
              <div className="flex items-center gap-3">{stepControl}</div>
            )}
            {i < steps.length - 1 && (
              <div
                className={`mx-4 h-0.5 min-w-[2rem] flex-1 rounded-full ${
                  dark ? (done ? "bg-white/50" : "bg-white/20") : done ? "booking-bg-accent" : "bg-gray-200 dark:bg-neutral-700"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ProgressPills({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-[7px]">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-[7px]">
            <div
              className={`flex items-center gap-[5px] rounded-full px-[9px] py-[5px] text-[11px] font-semibold ${
                active
                  ? "bg-white booking-text-accent shadow-sm"
                  : done
                    ? "bg-white/20 text-white/75"
                    : "bg-white/10 text-white/50"
              }`}
            >
              {done ? (
                <Icon name="check-lg" className="text-[9px]" />
              ) : (
                <span
                  className={`inline-block size-[8px] rounded-full ${active ? "bg-white/60" : "bg-white/30"}`}
                />
              )}
              {label}
            </div>
            {i < steps.length - 1 && <div className="h-px w-[8px] shrink-0 bg-white/25" />}
          </div>
        );
      })}
    </div>
  );
}

function BusinessIdentity({
  name,
  urlLabel,
  logoUrl,
  icon,
}: {
  name: string;
  urlLabel: string;
  logoUrl?: string | null;
  icon?: string | null;
}) {
  return (
    <div className="mb-[14px] flex items-center gap-[12px]">
      <BusinessAvatar name={name} logoUrl={logoUrl} icon={icon} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[16px] font-semibold leading-tight text-white">{name}</p>
        <p className="mt-[2px] truncate text-[11px] booking-text-accent-on-dark/80">{urlLabel}</p>
      </div>
    </div>
  );
}
