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
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { fadeInUp } from "@/lib/booking/booking-animations";
import StaffPicker from "./StaffPicker";
import StepLocation from "./StepLocation";
import { computeDiscountedPrice } from "@/lib/deals/pricing";

interface ServiceMetaPanelProps {
  business: BookingBusiness;
  bookingUrlLabel: string;
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
  onSelectStaff: (staff: Staff) => void;
  onSelectAnyStaff: () => void;
  onSelectLocation: (location: Pick<Location, "id" | "name" | "address">) => void;
  onChangeService?: () => void;
}

export function ServiceMetaPanel({
  business,
  bookingUrlLabel,
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

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3">
        <Avatar className="size-10" data-size="lg">
          {business.logoUrl ? <AvatarImage src={business.logoUrl} alt={business.name} /> : null}
          <AvatarFallback className="bg-[var(--booking-accent-muted)] font-semibold text-[var(--booking-accent)]">
            {business.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-foreground">{business.name}</p>
          <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <Icon name="lock-fill" className="text-[10px]" />
            {bookingUrlLabel}
          </p>
        </div>
      </div>

      {needsLocationPicker && (
        <div className="mt-5">
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
          <m.div key="service-info" {...fadeInUp} className="mt-5">
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
            <h2 className="text-lg font-semibold text-foreground">{service.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                <Icon name="clock" />
                {service.durationMinutes}m
              </Badge>
              {service.priceLkr > 0 ? (
                <Badge variant="outline">{formatLkr(price)}</Badge>
              ) : (
                <Badge variant="outline">Free</Badge>
              )}
            </div>
            {service.depositPercent > 0 && service.priceLkr > 0 && (
              <p className="mt-2 text-xs text-[var(--booking-accent)]">
                {copy.depositDue}:{" "}
                {formatLkr(Math.ceil((price * service.depositPercent) / 100))}
              </p>
            )}
            {service.description && (
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{service.description}</p>
            )}
          </m.div>
        )}
      </AnimatePresence>

      {service && needsStaffPicker && (
        <div className="mt-5">
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

      {service && (staff || anyStaff) && (
        <>
          <Separator className="my-5" />
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Icon name="person" className="shrink-0 text-[var(--booking-accent)]" />
              <span className="text-foreground">
                {anyStaff && !staff ? copy.anyAvailableStaff : staff?.name}
              </span>
            </div>
            {dateLabel && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Icon name="calendar3" className="shrink-0 text-[var(--booking-accent)]" />
                <span className="text-foreground">{dateLabel}</span>
              </div>
            )}
            {timeLabel && (
              <div className="flex items-center gap-3 text-muted-foreground">
                <Icon name="clock" className="shrink-0 text-emerald-500" />
                <span className="font-medium text-foreground">{timeLabel}</span>
              </div>
            )}
          </div>
        </>
      )}

      <AnimatePresence>
        {holdLabel && dateLabel && timeLabel && (
          <m.div
            key="selected-time"
            {...fadeInUp}
            className="mt-4 rounded-lg border border-emerald-200/80 bg-emerald-50/80 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/40"
          >
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-300">
              <Icon name="clock" className="mr-1" />
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
