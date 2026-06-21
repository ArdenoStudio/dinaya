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
import { BookingTheme } from "./BookingTheme";
import { useBookingUrlState, useBookingUrlSync, useStripBookingContactFromUrl } from "./useBookingUrlState";
import { useSlotHold } from "./useSlotHold";
import { getBookingCopy, formatBookingCopy } from "@/lib/i18n";
import { getEligibleStaff, pickDefaultStaff } from "@/lib/booking-staff";
import { trackBookingStart } from "@/lib/analytics/gtag";
import { ServiceMetaPanel } from "./ServiceMetaPanel";
import { BookingWizardSkeleton } from "./BookingWizardSkeleton";
import BookingBranding from "./BookingBranding";
import { BookingChoiceSummary } from "./BookingChoiceSummary";
import { BookingBackPill } from "./BookingBackPill";
import { BookingTeamSection } from "./BookingTeamSection";
import { BookingAttributionCapture } from "./BookingAttributionCapture";
import { BookingDealsSection } from "./BookingDealsSection";
import type { DealListItem } from "@/lib/deals/queries";
import { useBookingContactStorage } from "./useBookingContactStorage";
import {
  applyEmbedThemeFromQuery,
  createBookingCompletedEmbedEvent,
  postEmbedEvent,
} from "./embed-events";
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
  teamMembers?: Pick<Staff, "id" | "name" | "bio" | "avatarUrl">[];
  hubHref?: string | null;
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
  showBranding = true,
  activeDeals = [],
  initialDealId = null,
  bookingRouter = null,
  initialService = null,
  lockServiceSelection = false,
  embedMode = false,
  calendarOverlayConfig = null,
  avgRating,
  reviewCount,
  teamMembers = [],
  hubHref = null,
}: Props) {
  const copy = getBookingCopy(business.language);
  const router = useRouter();
  const timezone = business.timezone ?? COLOMBO_TZ;
  const { state: urlState } = useBookingUrlState();
  const needsLocationPicker = locations.length > 1;
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
    locationId: state.location?.id ?? null,
    enabled: true,
    formatHoldLabel: (minutes, seconds) =>
      formatBookingCopy(copy.slotHoldActive, {
        time: `${minutes}:${String(seconds).padStart(2, "0")}`,
      }),
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
        postEmbedEvent(createBookingCompletedEmbedEvent(business.slug, data.status));
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
      requestAnimationFrame(() => {
        document.getElementById("booking-contact-form")?.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      });
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
    },
    [locations, services, staff, staffServiceMap, staffLocationMap, state.location, todayStr, slotHold, markBookingStart],
  );

  useEffect(() => {
    if (!initialDealId || activeDeals.length === 0) return;
    const deal = activeDeals.find((item) => item.id === initialDealId);
    if (deal) applyDeal(deal);
  }, [initialDealId, activeDeals, applyDeal]);

  const clearSlot = useCallback(() => {
    update({ timeSlot: "", timeSlotEnd: "", timeLabel: "" });
    setSelectedSlot(null);
    void slotHold.releaseHold();
  }, [slotHold]);

  const clearService = useCallback(() => {
    clearSlot();
    update({ service: null, staff: null });
    setAnyStaff(false);
    setSelectedDealId(null);
    void slotHold.releaseHold();
  }, [clearSlot, slotHold]);

  const canPickSlots = Boolean(
    state.service && (state.staff || anyStaff || !needsStaffPicker),
  );

  const showContactForm = Boolean(
    selectedSlot &&
      state.timeLabel &&
      (state.staff || anyStaff) &&
      !slotHold.slotUnavailable &&
      (!needsLocationPicker || state.location),
  );

  const metaPanelProps = {
    business,
    service: state.service,
    staff: state.staff,
    anyStaff,
    allStaff: staff,
    staffServiceMap,
    staffLocationMap,
    locations,
    needsLocationPicker,
    selectedLocation: state.location,
    needsStaffPicker,
    selectedDate: state.date,
    timeLabel: state.timeLabel,
    holdLabel: slotHold.holdLabel,
    slotUnavailable: slotHold.slotUnavailable,
    selectedDeal,
    copy,
    lockServiceSelection,
    avgRating,
    reviewCount,
    onSelectStaff: (s: Staff) => {
      setAnyStaff(false);
      clearSlot();
      update({ staff: s });
    },
    onSelectAnyStaff: () => {
      setAnyStaff(true);
      clearSlot();
      update({ staff: null });
    },
    onSelectLocation: (location: Pick<Location, "id" | "name" | "address">) => {
      clearSlot();
      update({ location, staff: null });
    },
    onChangeService: !lockServiceSelection && !hubHref ? clearService : undefined,
  };

  const showBackPill =
    !embedMode &&
    Boolean(state.service) &&
    (Boolean(hubHref) || (!lockServiceSelection && services.length > 1));

  const backPillLabel = showContactForm
    ? copy.dateTime
    : hubHref
      ? copy.allServices
      : copy.back;

  const backPillHref = showContactForm ? undefined : hubHref ?? undefined;

  const backPillOnClick = showContactForm
    ? clearSlot
    : !hubHref && !lockServiceSelection
      ? clearService
      : undefined;

  const choiceDateLabel = state.date
    ? format(parseISO(state.date + "T12:00:00"), "EEE d MMM")
    : null;

  return (
    <BookingTheme accentColor={business.accentColor} embed={embedMode}>
      {showBackPill && (
        <div className="mb-3 flex justify-start px-4 md:mb-4 md:px-0">
          <BookingBackPill
            label={backPillLabel}
            href={backPillHref}
            onClick={backPillOnClick}
          />
        </div>
      )}
      <div className="w-full min-w-0 max-w-full bg-card lg:overflow-visible lg:rounded-xl lg:border lg:border-border lg:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] dark:lg:shadow-none dark:lg:ring-1 dark:lg:ring-white/10">
        <BookingAttributionCapture businessId={business.id} />
        <BookingDealsSection
          deals={activeDeals}
          selectedDealId={selectedDealId}
          onSelectDeal={applyDeal}
        />

        <div className="px-4 py-4 md:px-0 md:py-0">
          {!state.service ? (
            <div className="mx-auto w-full max-w-lg">
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
            </div>
          ) : (
            <div className="grid w-full min-w-0 max-w-full gap-0 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] lg:items-start lg:divide-x lg:divide-border xl:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
              <div className="border-b border-border pb-4 lg:sticky lg:top-6 lg:self-start lg:border-0 lg:px-4 lg:pb-6 lg:pt-6 xl:px-5">
                <ServiceMetaPanel {...metaPanelProps} />
              </div>

              <div className="min-w-0 lg:py-6">
                {state.service ? (
                  <div className="border-b border-border py-3 lg:hidden">
                    <BookingChoiceSummary
                      dateLabel={choiceDateLabel}
                      timeLabel={state.timeLabel || null}
                      stepLabel={
                        showContactForm
                          ? copy.details
                          : selectedSlot
                            ? copy.details
                            : copy.pickDateTime
                      }
                      holdLabel={slotHold.holdLabel}
                      slotUnavailable={slotHold.slotUnavailable}
                      slotTaken={copy.slotTaken}
                      slotTakenAction={copy.slotTakenAction}
                    />
                  </div>
                ) : null}
                {canPickSlots ? (
                  showContactForm ? (
                    <div className="md:px-6 lg:px-8">
                      <StepConfirm
                        variant="inline"
                        formId="booking-contact-form"
                        state={state}
                        business={business}
                        copy={copy}
                        selectedDeal={selectedDeal}
                        sessionToken={slotHold.sessionToken}
                        onUpdate={update}
                        onBack={clearSlot}
                        onConfirmed={handleConfirmed}
                        hideInlineBack={showBackPill}
                      />
                    </div>
                  ) : (
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
                        clearSlot();
                        update({ date });
                      }}
                      onSlotSelect={selectSlot}
                      onCalendarMonthChange={setCalendarViewMonth}
                      calendarOverlay={calendarOverlay}
                      hideHeading
                    />
                  )
                ) : (
                  <p className="py-12 text-center text-sm text-amber-600">{copy.noStaff}</p>
                )}
              </div>
            </div>
          )}
        </div>

        {state.service && teamMembers.length > 0 && !embedMode && !hubHref && (
          <BookingTeamSection
            members={teamMembers}
            copy={copy}
            variant="dialog"
            className="flex justify-center border-t border-border px-4 py-3"
          />
        )}
      </div>

      {showBranding && (
        <div className="mt-3 flex justify-center px-4 md:mt-4 md:px-0">
          <BookingBranding copy={copy} hideBranding={business.hideBranding} />
        </div>
      )}
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
