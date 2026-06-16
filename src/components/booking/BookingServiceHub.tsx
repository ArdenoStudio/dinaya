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
  services: BookingService[];
  copy: BookingCopy;
}

export default function BookingServiceHub({ businessSlug, services, copy }: Props) {
  if (services.length <= 1) return null;

  return (
    <section className="mx-4 mb-4 rounded-2xl border border-gray-100 bg-white p-5 md:mx-0 md:mb-6">
      <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {copy.chooseService}
      </p>
      <h2 className="mb-4 font-cal text-lg tracking-tight text-gray-900">{copy.hubTitle}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {services.map((service) => {
          const href = buildServiceBookingPath(businessSlug, service.slug ?? service.id);
          const depositAmount =
            service.depositPercent > 0
              ? Math.ceil((service.priceLkr * service.depositPercent) / 100)
              : service.priceLkr;

          return (
            <Link
              key={service.id}
              href={href}
              className="group flex flex-col rounded-xl border border-gray-100 p-4 transition-all hover:border-[var(--booking-accent)] hover:shadow-md"
            >
              {service.imageUrl ? (
                <div className="relative mb-3 aspect-[16/10] overflow-hidden rounded-lg bg-gray-100">
                  <Image
                    src={service.imageUrl}
                    alt=""
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover transition-transform group-hover:scale-[1.02]"
                    unoptimized={!isOptimizableRemoteImage(service.imageUrl)}
                  />
                </div>
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 group-hover:booking-text-accent">{service.name}</p>
                  {service.description ? (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">{service.description}</p>
                  ) : (
                    <p className="mt-1 text-sm text-gray-400">{service.durationMinutes} min</p>
                  )}
                </div>
                <Icon name="arrow-right" className="mt-1 shrink-0 text-gray-300 group-hover:booking-text-accent" />
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3 text-sm">
                <span className="text-gray-500">{service.durationMinutes} min</span>
                <span className="font-bold tabular-nums text-gray-800">
                  {service.priceLkr > 0 ? formatLkr(service.priceLkr) : "Free"}
                </span>
              </div>
              {service.requiresPayment && service.priceLkr > 0 && service.depositPercent > 0 && (
                <p className="mt-1 text-right text-[10px] font-medium booking-text-accent">
                  {copy.depositDue}: {formatLkr(depositAmount)}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
