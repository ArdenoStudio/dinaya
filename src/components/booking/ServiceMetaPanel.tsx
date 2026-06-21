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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fadeInUp } from "@/lib/booking/booking-animations";
import StaffPicker from "./StaffPicker";
import StepLocation from "./StepLocation";
import { computeDiscountedPrice } from "@/lib/deals/pricing";
import { BusinessRating, getBusinessRating } from "./BusinessRating";

interface ServiceMetaPanelProps {
  business: BookingBusiness;
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
  copy: BookingCopy;
  lockServiceSelection: boolean;
  avgRating?: number | null;
  reviewCount?: number;
  onSelectStaff: (staff: Staff) => void;
  onSelectAnyStaff: () => void;
  onSelectLocation: (location: Pick<Location, "id" | "name" | "address">) => void;
  onChangeService?: () => void;
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder > 0 ? `${hours}h ${remainder}m` : `${hours}h`;
}

export function ServiceMetaPanel({
  business,
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
  copy,
  lockServiceSelection,
  avgRating,
  reviewCount,
  onSelectStaff,
  onSelectAnyStaff,
  onSelectLocation,
  onChangeService,
}: ServiceMetaPanelProps) {
  const dateLabel = selectedDate
    ? format(parseISO(selectedDate + "T12:00:00"), "EEE, d MMM yyyy")
    : null;

  const price =
    service && selectedDeal && service.priceLkr > 0
      ? computeDiscountedPrice(service.priceLkr, selectedDeal.discountPercent)
      : service?.priceLkr ?? 0;

  const staffLabel = staff && staff.name !== business.name ? staff.name : null;
  const rating = getBusinessRating(avgRating, reviewCount);

  return (
    <div className="flex flex-col">
      <div className="flex items-start gap-3">
        <Avatar className="size-10 shrink-0" data-size="lg">
          {business.logoUrl ? (
            <AvatarImage src={business.logoUrl} alt={business.name} className="object-contain bg-white p-0.5" />
          ) : null}
          <AvatarFallback className="bg-[var(--booking-accent-muted)] text-sm font-semibold text-[var(--booking-accent)]">
            {business.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{business.name}</p>
          {rating && (
            <BusinessRating
              avgRating={rating.avgRating}
              reviewCount={rating.reviewCount}
              copy={copy}
              size="sm"
              className="mt-1.5"
            />
          )}
        </div>
      </div>

      {needsLocationPicker && (
        <div className="mt-6">
          <StepLocation
            locations={locations}
            selected={selectedLocation}
            copy={copy}
            onSelect={onSelectLocation}
          />
        </div>
      )}

      <AnimatePresence>
        {service && (
          <m.div
            key="service-info"
            {...fadeInUp}
            initial={lockServiceSelection ? false : fadeInUp.initial}
            className="mt-6 border-t border-border/70 pt-4"
          >
            {!lockServiceSelection && onChangeService && (
              <button
                type="button"
                onClick={onChangeService}
                className="mb-3 flex items-center gap-1 text-xs text-[var(--booking-accent)] hover:underline"
              >
                <Icon name="chevron-left" className="text-[10px]" />
                {copy.back}
              </button>
            )}
            <h2 className="text-xl font-semibold leading-tight text-foreground md:text-2xl">{service.name}</h2>
            {service.description && (
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
            )}
            <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-2">
                <Icon name="clock" className="size-3.5 shrink-0" />
                {formatDuration(service.durationMinutes)}
              </span>
              <span aria-hidden className="text-muted-foreground/50">
                ·
              </span>
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                {service.priceLkr > 0 ? formatLkr(price) : "Free"}
              </span>
            </div>
            {staffLabel && (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="person" className="shrink-0 text-base" />
                <span className="text-foreground">{staffLabel}</span>
              </p>
            )}
            {anyStaff && !staff && (
              <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                <Icon name="people" className="shrink-0 text-base" />
                <span className="text-foreground">{copy.anyAvailableStaff}</span>
              </p>
            )}
            {service.depositPercent > 0 && service.priceLkr > 0 && (
              <p className="mt-3 text-xs text-[var(--booking-accent)]">
                {copy.depositDue}: {formatLkr(Math.ceil((price * service.depositPercent) / 100))}
              </p>
            )}
          </m.div>
        )}
      </AnimatePresence>

      {service && needsStaffPicker && (
        <div className="mt-6">
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
        </div>
      )}

      {service && !staff && !anyStaff && !needsStaffPicker && (
        <p className="mt-3 text-center text-sm text-amber-600">{copy.noStaff}</p>
      )}

      {service && timeLabel && (
        <div className="mt-6 hidden border-t border-border/70 pt-4 lg:block">
          <div className="space-y-2 text-sm">
            {dateLabel && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="calendar3" className="size-3.5 shrink-0" />
                <span className="text-foreground">{dateLabel}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="clock" className="size-3.5 shrink-0 text-[var(--booking-accent)]" />
              <span className="font-medium text-foreground">{timeLabel}</span>
            </div>
          </div>
        </div>
      )}

      <AnimatePresence>
        {holdLabel && dateLabel && timeLabel && (
          <m.div
            key="selected-time"
            {...fadeInUp}
            className="mt-4 hidden rounded-lg booking-bg-accent-muted px-3 py-2 lg:block"
          >
            <p className="text-xs font-medium booking-text-accent">
              <Icon name="clock" className="mr-1.5" />
              {holdLabel}
            </p>
          </m.div>
        )}
      </AnimatePresence>

      {slotUnavailable && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-800/50 dark:bg-amber-950/40 dark:text-amber-200">
          <p className="font-medium">{copy.slotTaken}</p>
          <p className="mt-0.5">{copy.slotTakenAction}</p>
        </div>
      )}
    </div>
  );
}
