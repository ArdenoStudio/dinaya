"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format, parseISO } from "date-fns";
import { toZonedTime } from "date-fns-tz";
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
import { BookingFlowHeader } from "./BookingFlowHeader";
import { BookingStepIndicator } from "./BookingStepIndicator";
import { ServiceMetaPanel } from "./ServiceMetaPanel";
import { BookingWizardSkeleton } from "./BookingWizardSkeleton";
import { Button } from "@/components/ui/button";
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
  avgRating?: number | null;
  reviewCount?: number;
  businessDescription?: string | null;
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
  showBranding = true,
  activeDeals = [],
  initialDealId = null,
  bookingRouter = null,
  initialService = null,
  lockServiceSelection = false,
  embedMode = false,
  calendarOverlayConfig = null,
  avgRating = null,
  reviewCount = 0,
  businessDescription = null,
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
      <div className="min-w-0 overflow-hidden bg-card md:rounded-2xl md:border md:border-border md:shadow-[0_24px_64px_-12px_var(--booking-accent-shadow),0_8px_24px_-8px_rgba(0,0,0,0.08)]">
        <BookingAttributionCapture businessId={business.id} />
        <BookingDealsSection
          deals={activeDeals}
          selectedDealId={selectedDealId}
          onSelectDeal={applyDeal}
        />

        <BookingFlowHeader
          businessName={business.name}
          logoUrl={business.logoUrl}
          bookingUrlLabel={bookingUrlLabel}
          service={state.service}
          steps={progressSteps}
          currentStep={stepIndex}
          bookAppointmentLabel={copy.bookAppointment}
          avgRating={avgRating}
          reviewCount={reviewCount}
          description={businessDescription}
          onStepClick={(i) => {
            const target = indexToStep(i);
            if (i < stepIndex) setStep(target);
          }}
        />

        <div className="hidden border-b border-border px-8 py-4 md:block">
          <BookingStepIndicator
            steps={progressSteps}
            current={stepIndex}
            onStepClick={(i) => {
              const target = indexToStep(i);
              if (i < stepIndex) setStep(target);
            }}
          />
        </div>

        <BookingStepTransition step={step}>
        {step !== "confirm" && (
          <>
            <div className="px-4 py-4 md:px-8 md:py-7">
              <div className="grid gap-0 md:grid-cols-[minmax(0,17rem)_1fr] md:gap-10 lg:grid-cols-[minmax(0,20rem)_1fr] lg:gap-12">
                <div className="border-b border-border pb-4 md:border-0 md:border-r md:pb-0 md:pr-8 lg:pr-10">
                  {lockServiceSelection ? (
                    <>
                      <div className="hidden md:block">
                        <ServiceMetaPanel
                          business={business}
                          bookingUrlLabel={bookingUrlLabel}
                          service={state.service}
                          staff={state.staff}
                          anyStaff={anyStaff}
                          allStaff={staff}
                          staffServiceMap={staffServiceMap}
                          staffLocationMap={staffLocationMap}
                          locations={locations}
                          needsLocationPicker={needsLocationPicker}
                          selectedLocation={state.location}
                          needsStaffPicker={needsStaffPicker}
                          selectedDate={state.date}
                          timeLabel={state.timeLabel}
                          holdLabel={slotHold.holdLabel}
                          slotUnavailable={slotHold.slotUnavailable}
                          selectedDeal={selectedDeal}
                          copy={copy}
                          lockServiceSelection={lockServiceSelection}
                          onSelectStaff={(s) => {
                            setAnyStaff(false);
                            update({ staff: s, timeSlot: "", timeSlotEnd: "", timeLabel: "" });
                            setSelectedSlot(null);
                            void slotHold.releaseHold();
                          }}
                          onSelectAnyStaff={() => {
                            setAnyStaff(true);
                            update({ staff: null, timeSlot: "", timeSlotEnd: "", timeLabel: "" });
                            setSelectedSlot(null);
                            void slotHold.releaseHold();
                          }}
                          onSelectLocation={(location) => {
                            update({
                              location,
                              staff: null,
                              timeSlot: "",
                              timeSlotEnd: "",
                              timeLabel: "",
                            });
                            setSelectedSlot(null);
                            void slotHold.releaseHold();
                          }}
                        />
                      </div>
                      <div className="md:hidden">
                        {needsLocationPicker && (
                          <StepLocation
                            locations={locations}
                            selected={state.location}
                            copy={copy}
                            onSelect={(location) => {
                              update({
                                location,
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
                      </div>
                    </>
                  ) : (
                    <>
                      {needsLocationPicker && (
                        <StepLocation
                          locations={locations}
                          selected={state.location}
                          copy={copy}
                          onSelect={(location) => {
                            update({
                              location,
                              service: null,
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

                      <StepService
                        services={services}
                        selected={state.service}
                        copy={copy}
                        bookingRouter={bookingRouter}
                        onSelect={selectService}
                      />

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
                    </>
                  )}
                </div>

                <div className="min-w-0 pt-4 md:pt-0">
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

            <div className="hidden border-t border-border bg-muted/20 px-8 py-5 md:flex md:items-center md:gap-6">
              <div className="min-w-0 flex-1">
                {desktopSelectionLine ? (
                  <p className="truncate text-sm font-medium text-foreground">{desktopSelectionLine}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">{copy.selectServiceHint}</p>
                )}
                <p className="mt-0.5 text-xs text-muted-foreground">{copy.securedByPayHere}</p>
              </div>
              <Button
                type="button"
                onClick={goConfirm}
                disabled={!canProceedDesktop || slotHold.holding}
                className="h-10 shrink-0 bg-[var(--booking-accent)] px-8 text-white hover:bg-[var(--booking-accent)]/90"
              >
                {desktopPayCta}
              </Button>
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
    <Suspense fallback={<BookingWizardSkeleton />}>
      <BookingWizardInner {...props} />
    </Suspense>
  );
}
