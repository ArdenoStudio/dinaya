"use client";

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { AnimatePresence, LazyMotion, domAnimation } from "motion/react";
import type { Location, Staff } from "@/db/schema";
import type { IntakeQuestion } from "@/lib/intake";
import type { BookingRouter } from "@/lib/booking-router";
import StepService from "./StepService";
import StepLocation from "./StepLocation";
import StepDateTime from "./StepDateTime";
import StepConfirm from "./StepConfirm";
import { BookingPanel } from "./BookingPanel";
import { BookingTheme } from "./BookingTheme";
import { useBookingUrlState, useBookingUrlSync, useStripBookingContactFromUrl } from "./useBookingUrlState";
import { useSlotHold } from "./useSlotHold";
import { getBookingCopy } from "@/lib/i18n";
import { getEligibleStaff, pickDefaultStaff } from "@/lib/booking-staff";
import { BookingAttributionCapture } from "./BookingAttributionCapture";
import { BookingDealsSection } from "./BookingDealsSection";
import type { DealListItem } from "@/lib/deals/queries";
import { useBookingContactStorage } from "./useBookingContactStorage";
import { applyEmbedThemeFromQuery, postEmbedEvent } from "./embed-events";
import { trackBookingStart } from "@/lib/analytics/gtag";
import { fadeInLeft } from "@/lib/booking/booking-animations";
import { BusinessAvatar } from "./BusinessAvatar";
import { ServiceMetaPanel } from "./ServiceMetaPanel";
import BookingBranding from "./BookingBranding";
import { SlotListPanel } from "./SlotListPanel";
import { SlotPickerSheet } from "./SlotPickerSheet";
import { FormPanel } from "./FormPanel";
import type { SlotEmptyState, SlotOption } from "./TimeSlotGrid";

export type BookingUIState =
  | "selecting_service"
  | "selecting_date"
  | "selecting_time"
  | "booking";

const COLOMBO_TZ = "Asia/Colombo";

const CARD_CLS =
  "min-w-0 overflow-hidden md:rounded-2xl md:border md:border-gray-100 dark:border-neutral-800 md:bg-white dark:md:bg-neutral-900 md:shadow-[0_24px_64px_-12px_var(--booking-accent-shadow),0_8px_24px_-8px_rgba(0,0,0,0.08)]";

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
}: Props) {
  const copy = getBookingCopy(business.language);
  const router = useRouter();
  const timezone = business.timezone ?? COLOMBO_TZ;
  const { state: urlState } = useBookingUrlState();
  const needsLocationPicker = locations.length > 1;

  const [uiState, setUiState] = useState<BookingUIState>(
    initialService ? "selecting_date" : "selecting_service",
  );
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
  const [wizardSlots, setWizardSlots] = useState<SlotOption[]>([]);
  const [wizardLoadingSlots, setWizardLoadingSlots] = useState(false);
  const [wizardSlotEmptyState, setWizardSlotEmptyState] = useState<SlotEmptyState>("none");
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

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
    postEmbedEvent({ type: "dinaya:booking_started", slug: business.slug, serviceId: state.service.id });
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
    () => ({ clientName: state.clientName, clientPhone: state.clientPhone, clientEmail: state.clientEmail }),
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
      update({ service, staff: defaultStaff, date: todayStr, timeSlot: "", timeSlotEnd: "", timeLabel: "" });
      setSelectedSlot(null);
      setAnyStaff(false);
      void slotHold.releaseHold();
      setSelectedDealId(null);
      setUiState("selecting_date");
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

      update({ location: location ?? null, service, staff: dealStaff, date: todayStr, timeSlot: "", timeSlotEnd: "", timeLabel: "" });
      setSelectedSlot(null);
      setAnyStaff(false);
      void slotHold.releaseHold();
      setUiState("selecting_date");
    },
    [locations, services, staff, staffServiceMap, staffLocationMap, state.location, todayStr, slotHold, markBookingStart],
  );

  useEffect(() => {
    if (!initialDealId || activeDeals.length === 0) return;
    const deal = activeDeals.find((item) => item.id === initialDealId);
    if (deal) applyDeal(deal);
  }, [initialDealId, activeDeals, applyDeal]);


  const gridStyle = useMemo((): React.CSSProperties => {
    const vars = {
      "--booker-meta-width": "280px",
      "--booker-main-width": "480px",
      "--booker-timeslots-width": "260px",
      "--booker-meta-width-booking": "340px",
      "--booker-main-width-booking": "420px",
    } as React.CSSProperties;

    if (uiState === "selecting_time") return {
      ...vars,
      gridTemplateAreas: `"meta main timeslots"`,
      gridTemplateColumns: `var(--booker-meta-width) 1fr var(--booker-timeslots-width)`,
    };
    if (uiState === "booking") return {
      ...vars,
      gridTemplateAreas: `"meta main"`,
      gridTemplateColumns: `var(--booker-meta-width-booking) var(--booker-main-width-booking)`,
    };
    return {
      ...vars,
      gridTemplateAreas: `"meta main"`,
      gridTemplateColumns: `var(--booker-meta-width) var(--booker-main-width)`,
    };
  }, [uiState]);

  return (
    <BookingTheme accentColor={business.accentColor} embed={embedMode}>
      {/* Service selection — full width, no grid */}
      {uiState === "selecting_service" && (
        <div className={CARD_CLS}>
          <BookingAttributionCapture businessId={business.id} />
          <BookingDealsSection deals={activeDeals} selectedDealId={selectedDealId} onSelectDeal={applyDeal} />
          <div className="p-[14px] md:p-8">
            <div className="mb-5 flex items-center gap-3">
              <BusinessAvatar name={business.name} logoUrl={business.logoUrl} icon={businessIcon} size="md" />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{business.name}</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{bookingUrlLabel}</p>
              </div>
            </div>
            {needsLocationPicker && (
              <StepLocation
                locations={locations}
                selected={state.location}
                copy={copy}
                onSelect={(location) => {
                  update({ location, service: lockServiceSelection ? state.service : null, staff: null, timeSlot: "", timeSlotEnd: "", timeLabel: "" });
                  setSelectedSlot(null);
                  void slotHold.releaseHold();
                }}
              />
            )}
            <StepService services={services} selected={state.service} copy={copy} bookingRouter={bookingRouter} onSelect={selectService} />
          </div>
          {showBranding && <BookingBranding copy={copy} hideBranding={business.hideBranding} />}
        </div>
      )}

      {/* Grid layout — selecting_date, selecting_time, booking */}
      {uiState !== "selecting_service" && (
        <div className={CARD_CLS}>
          <BookingAttributionCapture businessId={business.id} />
          <LazyMotion features={domAnimation}>
            <div
              className="block md:grid md:items-start md:transition-[width] md:duration-300 md:motion-reduce:transition-none"
              style={gridStyle}
            >
              <AnimatePresence>
                {/* Meta panel — always shown in grid states */}
                <BookingPanel
                  key="meta"
                  area="meta"
                  className="border-b border-gray-100 dark:border-neutral-800 p-[14px] md:sticky md:top-0 md:self-start md:border-b-0 md:border-r md:p-6"
                >
                  <ServiceMetaPanel
                    business={business}
                    bookingUrlLabel={bookingUrlLabel}
                    businessIcon={businessIcon}
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
                    activeDeals={activeDeals}
                    copy={copy}
                    showBranding={showBranding}
                    hideBranding={business.hideBranding}
                    lockServiceSelection={lockServiceSelection}
                    onSelectDeal={applyDeal}
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
                    onSelectLocation={(loc) => {
                      update({ location: loc, service: lockServiceSelection ? state.service : null, staff: null, timeSlot: "", timeSlotEnd: "", timeLabel: "" });
                      setSelectedSlot(null);
                      void slotHold.releaseHold();
                    }}
                    onChangeService={!lockServiceSelection ? () => setUiState("selecting_service") : undefined}
                  />
                </BookingPanel>

                {/* Main panel — date selection */}
                {(uiState === "selecting_date" || uiState === "selecting_time") && (
                  <BookingPanel
                    key="main"
                    area="main"
                    {...fadeInLeft}
                    className="min-w-0 p-[14px] md:p-6"
                  >
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
                        if (uiState === "selecting_date") setUiState("selecting_time");
                      }}
                      onSlotSelect={selectSlot}
                      onBack={!lockServiceSelection ? () => setUiState("selecting_service") : undefined}
                      hideSlots
                      onSlotsChange={(s, loading, emptyState) => {
                        setWizardSlots(s);
                        setWizardLoadingSlots(loading);
                        setWizardSlotEmptyState(emptyState);
                      }}
                    />
                  </BookingPanel>
                )}

                {/* Timeslots panel — desktop only; mobile uses SlotPickerSheet */}
                {uiState === "selecting_time" && !isMobile && (
                  <BookingPanel
                    key="timeslots"
                    area="timeslots"
                    {...fadeInLeft}
                    className="border-l border-gray-100 dark:border-neutral-800 p-5"
                  >
                    <SlotListPanel
                      slots={wizardSlots}
                      selectedStartUtc={selectedSlot?.startUtc ?? null}
                      copy={copy}
                      onSelect={selectSlot}
                      loading={wizardLoadingSlots}
                      emptyState={wizardSlotEmptyState}
                      timezone={timezone}
                    />
                  </BookingPanel>
                )}

                {/* Form panel — booking state */}
                {uiState === "booking" && (
                  <BookingPanel key="main-form" area="main" {...fadeInLeft}>
                    <FormPanel>
                      <StepConfirm
                        state={state}
                        business={business}
                        copy={copy}
                        selectedDeal={selectedDeal}
                        sessionToken={slotHold.sessionToken}
                        onUpdate={update}
                        onBack={() => setUiState("selecting_time")}
                        onConfirmed={handleConfirmed}
                      />
                    </FormPanel>
                  </BookingPanel>
                )}
              </AnimatePresence>
            </div>
          </LazyMotion>

          {/* Mobile slot picker bottom sheet */}
          <SlotPickerSheet
            open={isMobile && uiState === "selecting_time"}
            onClose={() => setUiState("selecting_date")}
            selectedDate={state.date}
            slots={wizardSlots}
            selectedStartUtc={selectedSlot?.startUtc ?? null}
            copy={copy}
            onSelect={selectSlot}
            loading={wizardLoadingSlots}
            emptyState={wizardSlotEmptyState}
            timezone={timezone}
          />
        </div>
      )}
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
