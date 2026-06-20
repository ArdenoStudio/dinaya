"use client";

import Link from "next/link";
import Image from "next/image";
import { formatLkr, isOptimizableRemoteImage, cn } from "@/lib/utils";
import { buildServiceBookingPath } from "@/lib/booking-url";
import { Icon } from "@/components/ui/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BlurFade } from "@/components/ui/blur-fade";
import { BookingHubHeroImage } from "@/components/booking/BookingHubHeroImage";
import { BookingHubCta } from "@/components/booking/BookingHubCta";
import { BookingPolicyAccordion } from "@/components/booking/BookingPolicyAccordion";
import { BusinessRating, getBusinessRating } from "./BusinessRating";
import type { BookingCopy } from "@/lib/i18n";
import type { BookingService } from "./BookingWizard";

interface Props {
  businessSlug: string;
  businessName: string;
  businessLogoUrl?: string | null;
  businessDescription?: string | null;
  heroImageUrl?: string | null;
  services: BookingService[];
  copy: BookingCopy;
  avgRating?: number | null;
  reviewCount?: number;
  cancellationPolicy?: string | null;
  depositPolicy?: string | null;
  bankTransferInstructions?: string | null;
}

function serviceInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export default function BookingServiceHub({
  businessSlug,
  businessName,
  businessLogoUrl,
  businessDescription,
  heroImageUrl,
  services,
  copy,
  avgRating,
  reviewCount,
  cancellationPolicy,
  depositPolicy,
  bankTransferInstructions,
}: Props) {
  if (services.length <= 1) return null;

  const rating = getBusinessRating(avgRating, reviewCount);
  const primaryService = services[0]!;
  const primaryHref = buildServiceBookingPath(
    businessSlug,
    primaryService.slug ?? primaryService.id,
  );
  const tagline =
    businessDescription?.trim() ||
    copy.selectServiceHint;

  const shell =
    "overflow-hidden rounded-none border-x-0 bg-card shadow-none md:rounded-2xl md:border md:border-border/80 md:shadow-[0_12px_40px_-24px_rgba(15,23,42,0.28)]";

  return (
    <BlurFade className="w-full">
      <article className={cn("flex w-full flex-col", shell)}>
        {heroImageUrl ? (
          <BookingHubHeroImage src={heroImageUrl} alt={businessName} />
        ) : null}

        <header className="flex flex-col gap-4 px-4 pb-2 pt-5 md:px-6 md:pt-6">
          <div className="flex items-start gap-4">
            <Avatar className="size-14 shrink-0 ring-2 ring-border/60" data-size="lg">
              {businessLogoUrl ? (
                <AvatarImage
                  src={businessLogoUrl}
                  alt=""
                  className="bg-white object-contain p-1"
                />
              ) : null}
              <AvatarFallback className="bg-[var(--booking-accent-muted)] text-lg font-semibold text-[var(--booking-accent)]">
                {serviceInitial(businessName)}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0 flex-1">
              <h1 className="font-cal text-2xl font-semibold tracking-tight text-foreground md:text-[1.65rem]">
                {businessName}
              </h1>
              <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                {tagline}
              </p>
              {rating ? (
                <BusinessRating
                  avgRating={rating.avgRating}
                  reviewCount={rating.reviewCount}
                  copy={copy}
                  size="sm"
                  animateCount
                  className="mt-2.5"
                />
              ) : null}
            </div>

            <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
              {services.length} services
            </Badge>
          </div>

          <div className="hidden items-center justify-between gap-3 md:flex">
            <p className="text-sm text-muted-foreground">{copy.chooseServiceAndTime}</p>
            <BookingHubCta
              businessSlug={businessSlug}
              serviceSlug={primaryService.slug ?? primaryService.id}
              label={copy.chooseService}
              variant="inline"
            />
          </div>
        </header>

        <Separator className="opacity-60" />

        <ul className="flex flex-col gap-1 p-2 md:gap-1.5 md:p-3">
          {services.map((service, index) => {
            const href = buildServiceBookingPath(businessSlug, service.slug ?? service.id);
            const depositAmount =
              service.depositPercent > 0
                ? Math.ceil((service.priceLkr * service.depositPercent) / 100)
                : service.priceLkr;

            return (
              <li key={service.id}>
                <Link
                  href={href}
                  className={cn(
                    "group flex min-h-[4.75rem] items-start gap-4 rounded-xl px-3 py-3.5",
                    "transition-[background-color,transform,box-shadow] duration-200 ease-out",
                    "hover:bg-muted/55 active:scale-[0.995]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent-soft)]",
                  )}
                  style={{ transitionDelay: `${index * 20}ms` }}
                >
                  {service.imageUrl ? (
                    <Image
                      src={service.imageUrl}
                      alt=""
                      width={52}
                      height={52}
                      className="size-[3.25rem] shrink-0 rounded-xl object-cover ring-1 ring-border/50"
                      unoptimized={!isOptimizableRemoteImage(service.imageUrl)}
                    />
                  ) : (
                    <div className="flex size-[3.25rem] shrink-0 items-center justify-center rounded-xl bg-[var(--booking-accent-muted)] text-sm font-semibold text-[var(--booking-accent)] ring-1 ring-border/40">
                      {serviceInitial(service.name)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground transition-colors duration-200 group-hover:text-[var(--booking-accent)]">
                      {service.name}
                    </p>
                    {service.description ? (
                      <p className="mt-0.5 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {service.description}
                      </p>
                    ) : null}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="font-normal">
                        <Icon name="clock" />
                        {service.durationMinutes}m
                      </Badge>
                      {service.priceLkr > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200/70 font-normal text-amber-900 dark:border-amber-800/40 dark:text-amber-200"
                        >
                          <Icon name="cash-stack" />
                          {formatLkr(service.priceLkr)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Free</Badge>
                      )}
                      {service.requiresPayment &&
                      service.depositPercent > 0 &&
                      service.priceLkr > 0 ? (
                        <Badge variant="outline" className="font-normal">
                          <Icon name="shield-check" />
                          {copy.depositDue}: {formatLkr(depositAmount)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>

                  <Icon
                    name="chevron-right"
                    className="mt-1 shrink-0 text-muted-foreground/50 transition-transform duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-[var(--booking-accent)]"
                  />
                </Link>
              </li>
            );
          })}
        </ul>

        {(cancellationPolicy || depositPolicy || bankTransferInstructions) && (
          <>
            <Separator className="opacity-60" />
            <div className="px-2 pb-2 md:px-3 md:pb-3">
              <BookingPolicyAccordion
                copy={copy}
                cancellationPolicy={cancellationPolicy}
                depositPolicy={depositPolicy}
                bankTransferInstructions={bankTransferInstructions}
                variant="embedded"
              />
            </div>
          </>
        )}

        <div className="sr-only">
          <Link href={primaryHref}>{copy.chooseService}</Link>
        </div>
      </article>

      <BookingHubCta
        businessSlug={businessSlug}
        serviceSlug={primaryService.slug ?? primaryService.id}
        label={copy.chooseService}
        variant="sticky"
        className="mt-0"
      />
    </BlurFade>
  );
}
