"use client";

import { format, parseISO } from "date-fns";
import type { Staff } from "@/db/schema";
import type { BookingService } from "./BookingWizard";
import type { BookingCopy } from "@/lib/i18n";
import { formatLkr } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import type { DealListItem } from "@/lib/deals/queries";
import { computeDiscountedPrice } from "@/lib/deals/pricing";

interface Props {
  copy: BookingCopy;
  service: BookingService | null;
  staff: Staff | null;
  anyStaff?: boolean;
  date: string;
  timeLabel: string;
  holdLabel?: string | null;
  selectedDeal?: DealListItem | null;
}

export default function BookingDesktopSummary({
  copy,
  service,
  staff,
  anyStaff,
  date,
  timeLabel,
  holdLabel,
  selectedDeal,
}: Props) {
  if (!service) {
    return (
      <div className="mt-6 rounded-xl border border-dashed border-gray-200 dark:border-neutral-800 bg-gray-50 dark:bg-neutral-900/60 p-5">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-xl booking-bg-accent-muted">
            <Icon name="calendar2-week" className="text-lg booking-text-accent" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{copy.selectServiceHint}</p>
            <p className="mt-1 text-xs leading-relaxed text-gray-400 dark:text-gray-500">
              {copy.chooseServiceAndTime}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const dateLabel = date
    ? format(parseISO(date + "T12:00:00"), "EEE, d MMM yyyy")
    : null;

  const price =
    selectedDeal && service.priceLkr > 0
      ? computeDiscountedPrice(service.priceLkr, selectedDeal.discountPercent)
      : service.priceLkr;

  const depositPreview =
    service.depositPercent > 0 && service.priceLkr > 0
      ? Math.ceil((price * service.depositPercent) / 100)
      : price;

  return (
    <div className="mt-6 rounded-xl border border-gray-100 dark:border-neutral-800 bg-gradient-to-br from-gray-50 to-blue-50/30 p-5">
      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
        {copy.yourBooking}
      </p>
      <ul className="space-y-3 text-sm">
        <li className="flex items-start gap-3">
          <Icon name="scissors" className="mt-0.5 booking-text-accent" />
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100">{service.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {service.durationMinutes} min
              {service.priceLkr > 0 ? ` · ${formatLkr(price)}` : " · Free"}
            </p>
            {service.requiresPayment && service.depositPercent > 0 && service.priceLkr > 0 && (
              <p className="mt-0.5 text-[11px] font-medium booking-text-accent">
                {copy.depositDue}: {formatLkr(depositPreview)}
              </p>
            )}
          </div>
        </li>
        {(staff || anyStaff) && (
          <li className="flex items-center gap-3">
            <Icon name="person" className="booking-text-accent" />
            <span className="text-gray-700 dark:text-gray-300">
              {anyStaff && !staff ? copy.anyAvailableStaff : staff?.name}
            </span>
          </li>
        )}
        {dateLabel && (
          <li className="flex items-center gap-3">
            <Icon name="calendar3" className="booking-text-accent" />
            <span className="text-gray-700 dark:text-gray-300">{dateLabel}</span>
          </li>
        )}
        {timeLabel && (
          <li className="flex items-center gap-3">
            <Icon name="clock" className="text-emerald-500" />
            <span className="font-medium text-emerald-700">{timeLabel}</span>
          </li>
        )}
      </ul>
      {holdLabel ? (
        <p className="mt-3 rounded-lg booking-bg-accent-muted px-3 py-2 text-xs font-medium booking-text-accent">
          <Icon name="clock" className="mr-1.5" />
          {holdLabel}
        </p>
      ) : null}
      {!dateLabel && (
        <p className="mt-3 border-t border-gray-100 dark:border-neutral-800 pt-3 text-xs text-gray-400 dark:text-gray-500">
          {copy.pickDateTime}
        </p>
      )}
    </div>
  );
}
