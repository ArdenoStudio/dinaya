"use client";

import { AnimatePresence, m } from "motion/react";
import { format, parseISO } from "date-fns";
import type { Staff } from "@/db/schema";
import type { Location } from "@/db/schema";
import type { BookingBusiness, BookingService } from "./BookingWizard";
import type { BookingCopy } from "@/lib/i18n";
import type { DealListItem } from "@/lib/deals/queries";
import { formatLkr } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { fadeInUp } from "@/lib/booking/booking-animations";
import { BusinessAvatar } from "./BusinessAvatar";
import StaffPicker from "./StaffPicker";
import { BookingDealsSection } from "./BookingDealsSection";
import BookingBranding from "./BookingBranding";
import StepLocation from "./StepLocation";

interface ServiceMetaPanelProps {
  business: BookingBusiness;
  bookingUrlLabel: string;
  businessIcon?: string | null;
  service: BookingService | null;
  staff: Staff | null;
  anyStaff: boolean;
  allStaff: Staff[];
  staffServiceMap: { staffId: string; serviceId: string }[];
  staffLocationMap: { staffId: string; locationId: string }[];
  locations: Pick<Location, "id" | "name" | "address">[];
  needsLocationPicker: boolean;
  selectedLocation: Pick<Location, "id" | "name" | "address"> | null;
  needsStaffPicker: boolean;
  selectedDate: string;
  timeLabel: string;
  holdLabel: string | null;
  slotUnavailable: boolean;
  selectedDeal: DealListItem | null;
  activeDeals: DealListItem[];
  copy: BookingCopy;
  showBranding: boolean;
  hideBranding?: boolean;
  lockServiceSelection: boolean;
  onSelectDeal: (deal: DealListItem | null) => void;
  onSelectStaff: (staff: Staff) => void;
  onSelectAnyStaff: () => void;
  onSelectLocation: (location: Pick<Location, "id" | "name" | "address">) => void;
  onChangeService?: () => void;
}

export function ServiceMetaPanel({
  business,
  bookingUrlLabel,
  businessIcon,
  service,
  staff,
  anyStaff,
  allStaff,
  staffServiceMap,
  staffLocationMap,
  locations,
  needsLocationPicker,
  selectedLocation,
  needsStaffPicker,
  selectedDate,
  timeLabel,
  holdLabel,
  slotUnavailable,
  selectedDeal,
  activeDeals,
  copy,
  showBranding,
  hideBranding,
  lockServiceSelection,
  onSelectDeal,
  onSelectStaff,
  onSelectAnyStaff,
  onSelectLocation,
  onChangeService,
}: ServiceMetaPanelProps) {
  const dateLabel = selectedDate
    ? format(parseISO(selectedDate + "T12:00:00"), "EEE d MMM")
    : null;

  return (
    <div className="flex h-full flex-col">
      {/* Business identity */}
      <div className="mb-4 flex items-center gap-3">
        <BusinessAvatar name={business.name} logoUrl={business.logoUrl} icon={businessIcon} size="md" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{business.name}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-400 dark:text-gray-500">
            <Icon name="lock-fill" className="text-[10px]" />
            {bookingUrlLabel}
          </p>
        </div>
      </div>

      {/* Deals */}
      {activeDeals.length > 0 && (
        <BookingDealsSection
          deals={activeDeals}
          selectedDealId={selectedDeal?.id ?? null}
          onSelectDeal={onSelectDeal}
        />
      )}

      {/* Location picker */}
      {needsLocationPicker && (
        <StepLocation
          locations={locations}
          selected={selectedLocation}
          copy={copy}
          onSelect={onSelectLocation}
        />
      )}

      {/* Service info — fades up when service selected */}
      <AnimatePresence>
        {service && (
          <m.div
            key="service-info"
            {...fadeInUp}
            className="mb-4 rounded-xl border border-gray-100 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/60 p-4"
          >
            {!lockServiceSelection && onChangeService && (
              <button
                type="button"
                onClick={onChangeService}
                className="mb-2 flex items-center gap-1 text-xs booking-text-accent hover:underline"
              >
                <Icon name="chevron-left" className="text-[10px]" />
                {copy.back}
              </button>
            )}
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
              {copy.service}
            </p>
            <p className="mt-1 font-semibold text-gray-900 dark:text-gray-100">{service.name}</p>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
              {service.durationMinutes} min
              {service.priceLkr > 0 ? ` · ${formatLkr(service.priceLkr)}` : ""}
            </p>
            {service.depositPercent > 0 && service.priceLkr > 0 && (
              <p className="mt-0.5 text-xs booking-text-accent">
                {copy.depositDue}:{" "}
                {formatLkr(Math.ceil((service.priceLkr * service.depositPercent) / 100))}
              </p>
            )}
            {service.description && (
              <p className="mt-1.5 line-clamp-2 text-xs text-gray-400 dark:text-gray-500">
                {service.description}
              </p>
            )}
          </m.div>
        )}
      </AnimatePresence>

      {/* Staff picker */}
      {service && needsStaffPicker && (
        <StaffPicker
          allStaff={allStaff}
          staffServiceMap={staffServiceMap}
          staffLocationMap={staffLocationMap}
          locationId={selectedLocation?.id}
          serviceId={service.id}
          selected={staff}
          anyStaffSelected={anyStaff}
          copy={copy}
          onSelect={onSelectStaff}
          onSelectAny={onSelectAnyStaff}
          compact
        />
      )}

      {service && !staff && !anyStaff && !needsStaffPicker && (
        <p className="mt-3 text-center text-sm text-amber-600">{copy.noStaff}</p>
      )}

      {/* Selected time — fades up when slot is held */}
      <AnimatePresence>
        {holdLabel && dateLabel && timeLabel && (
          <m.div
            key="selected-time"
            {...fadeInUp}
            className="mt-4 rounded-xl border border-emerald-100 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/40 p-3"
          >
            <div className="flex items-start gap-2">
              <Icon name="check-circle-fill" className="mt-0.5 shrink-0 text-emerald-500" />
              <div>
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-200">
                  {dateLabel} · {timeLabel}
                </p>
                <p className="mt-0.5 text-xs text-emerald-600 dark:text-emerald-400">
                  <Icon name="clock" className="mr-1" />
                  {holdLabel}
                </p>
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {slotUnavailable && (
        <div className="mt-3 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/40 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
          <p className="font-medium">{copy.slotTaken}</p>
          <p className="mt-0.5 text-amber-700/90 dark:text-amber-300/90">{copy.slotTakenAction}</p>
        </div>
      )}

      {/* Branding pinned to bottom */}
      {showBranding && (
        <div className="mt-auto pt-6">
          <BookingBranding copy={copy} hideBranding={hideBranding} />
        </div>
      )}
    </div>
  );
}
