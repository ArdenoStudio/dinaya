"use client";

import Link from "next/link";
import Image from "next/image";
import { formatLkr, isOptimizableRemoteImage } from "@/lib/utils";
import { buildServiceBookingPath } from "@/lib/booking-url";
import { Icon } from "@/components/ui/Icon";
import type { BookingCopy } from "@/lib/i18n";
import type { BookingService } from "./BookingWizard";

interface Props {
  businessSlug: string;
  businessName: string;
  businessLogoUrl?: string | null;
  services: BookingService[];
  copy: BookingCopy;
}

export default function BookingServiceHub({ businessSlug, businessName, businessLogoUrl, services, copy }: Props) {
  if (services.length <= 1) return null;

  return (
    <div className="mx-4 mb-4 md:mx-auto md:mb-6 md:max-w-2xl space-y-3">
      {/* Business profile card */}
      <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-6 py-5">
        {businessLogoUrl ? (
          <Image
            src={businessLogoUrl}
            alt={businessName}
            width={56}
            height={56}
            className="mb-3 size-14 rounded-full object-cover"
            unoptimized={!isOptimizableRemoteImage(businessLogoUrl)}
          />
        ) : (
          <div className="mb-3 flex size-14 items-center justify-center rounded-full booking-bg-accent-muted text-xl font-bold booking-text-accent">
            {businessName.charAt(0)}
          </div>
        )}
        <p className="font-cal text-xl font-medium text-gray-900 dark:text-gray-100">{businessName}</p>
      </div>

      {/* Service list */}
      <div className="rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        {services.map((service, i) => {
          const href = buildServiceBookingPath(businessSlug, service.slug ?? service.id);
          const depositAmount =
            service.depositPercent > 0
              ? Math.ceil((service.priceLkr * service.depositPercent) / 100)
              : service.priceLkr;

          return (
            <Link
              key={service.id}
              href={href}
              className={`group block px-5 py-4 transition-colors hover:bg-gray-50 dark:hover:bg-neutral-800/60 ${
                i > 0 ? "border-t border-gray-100 dark:border-neutral-800" : ""
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:booking-text-accent">
                    {service.name}
                  </p>
                  {service.description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                      {service.description}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-neutral-700 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                      <Icon name="clock" className="text-[10px]" />
                      {service.durationMinutes}m
                    </span>
                    {service.priceLkr > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-neutral-700 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                        <Icon name="cash-coin" className="text-[10px]" />
                        {formatLkr(service.priceLkr)}
                      </span>
                    )}
                    {service.priceLkr === 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-neutral-700 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                        Free
                      </span>
                    )}
                    {service.requiresPayment && service.depositPercent > 0 && service.priceLkr > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-neutral-700 px-2 py-0.5 text-xs text-gray-500 dark:text-gray-400">
                        <Icon name="shield-check" className="text-[10px]" />
                        {copy.depositDue}: {formatLkr(depositAmount)}
                      </span>
                    )}
                  </div>
                </div>
                <Icon name="chevron-right" className="mt-1 shrink-0 text-gray-300 dark:text-neutral-600 group-hover:booking-text-accent" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
