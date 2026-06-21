"use client";

import Link from "next/link";
import Image from "next/image";
import { isOptimizableRemoteImage, cn } from "@/lib/utils";
import { buildServiceBookingPath } from "@/lib/booking-url";
import {
  formatHubLocationLine,
  hubTagline,
  serviceIconName,
} from "@/lib/booking-hub-present";
import { BookingServiceArrow } from "@/components/booking/BookingServiceArrow";
import { BookingServicePrice } from "@/components/booking/BookingServicePrice";
import { Icon } from "@/components/ui/Icon";
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
  businessAddress?: string | null;
  businessPhone?: string | null;
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

function HubBusinessLogo({
  businessName,
  logoUrl,
}: {
  businessName: string;
  logoUrl?: string | null;
}) {
  return (
    <div
      className="mb-4 flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-border/80 bg-muted/30 shadow-sm ring-1 ring-border/40 md:mb-5 md:size-[4.5rem]"
      aria-hidden={logoUrl ? undefined : true}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={72}
          height={72}
          className="size-full bg-white object-contain p-2"
          unoptimized={!isOptimizableRemoteImage(logoUrl)}
        />
      ) : (
        <span className="text-xl font-semibold text-[var(--booking-accent)] md:text-2xl">
          {serviceInitial(businessName)}
        </span>
      )}
    </div>
  );
}

export default function BookingServiceHub({
  businessSlug,
  businessName,
  businessLogoUrl,
  businessDescription,
  businessAddress,
  businessPhone,
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
  const primaryCtaLabel = `${copy.chooseTime} · ${primaryService.name}`;
  const tagline = hubTagline(businessDescription, copy.selectServiceHint);
  const locationLine = formatHubLocationLine(businessAddress, businessPhone);

  const shell =
    "overflow-hidden rounded-none border-x-0 bg-card shadow-none md:rounded-2xl md:border md:border-border/80 md:shadow-[0_12px_40px_-24px_rgba(15,23,42,0.28)] dark:md:shadow-none dark:md:ring-1 dark:md:ring-white/10";

  return (
    <BlurFade className="w-full pb-28 md:pb-0">
      <article className={cn("flex w-full flex-col", shell)}>
        {heroImageUrl ? (
          <div className="relative">
            <BookingHubHeroImage src={heroImageUrl} alt={businessName} />
          </div>
        ) : null}

        <header
          className={cn(
            "flex flex-col items-center px-4 pb-4 text-center md:px-6",
            heroImageUrl ? "pt-5" : "pt-6 md:pt-8",
          )}
        >
          <HubBusinessLogo businessName={businessName} logoUrl={businessLogoUrl} />
          <h1 className="text-[1.625rem] font-bold leading-tight tracking-tight text-foreground md:text-3xl">
            {businessName}
          </h1>
          <p className="mt-2 max-w-md text-[0.9375rem] leading-relaxed text-muted-foreground">
            {tagline}
          </p>
          {rating ? (
            <BusinessRating
              avgRating={rating.avgRating}
              reviewCount={rating.reviewCount}
              copy={copy}
              size="sm"
              compactAttribution
              className="mt-3 justify-center"
            />
          ) : null}
          {locationLine ? (
            <p className="mt-2 flex items-start justify-center gap-1.5 text-sm text-foreground/75">
              <Icon name="geo-alt" className="mt-0.5 shrink-0 text-muted-foreground" />
              <span>{locationLine}</span>
            </p>
          ) : null}

          <div className="mt-5 hidden w-full border-t border-border/50 pt-4 md:block">
            <p className="text-sm text-muted-foreground">
              {copy.chooseServiceAndTime}
              <span className="ml-2 text-foreground/60">· {services.length} services</span>
            </p>
          </div>
        </header>

        <Separator className="bg-border/50" />

        <ul className="flex flex-col gap-2.5 px-4 py-3 md:gap-2.5 md:px-6 md:pb-4">
          {services.map((service) => {
            const href = buildServiceBookingPath(businessSlug, service.slug ?? service.id);
            const iconName = serviceIconName(service.name);

            return (
              <li key={service.id}>
                <Link
                  href={href}
                  className={cn(
                    "group flex min-h-[4.75rem] items-start gap-3.5 rounded-xl border border-border/50 px-3.5 py-4 md:px-4 md:py-[1.125rem]",
                    "transition-[background-color,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    "hover:border-[var(--booking-accent)]/25 hover:bg-[var(--booking-accent-muted)] hover:shadow-sm",
                    "active:scale-[0.99] motion-reduce:active:scale-100",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent-soft)]",
                  )}
                >
                  {service.imageUrl ? (
                    <Image
                      src={service.imageUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="size-12 shrink-0 rounded-xl object-cover ring-1 ring-border/50"
                      unoptimized={!isOptimizableRemoteImage(service.imageUrl)}
                    />
                  ) : (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--booking-accent-muted)] ring-1 ring-border/40">
                      <Icon
                        name={iconName}
                        className="text-lg text-[var(--booking-accent)]"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold leading-snug text-foreground transition-colors duration-200 group-hover:text-[var(--booking-accent)]">
                      {service.name}
                    </p>
                    {service.description ? (
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {service.description}
                      </p>
                    ) : null}
                    <p className="mt-2 text-sm text-muted-foreground">
                      {service.durationMinutes}m
                      <span aria-hidden className="text-muted-foreground/50">
                        {" "}
                        ·{" "}
                      </span>
                      <BookingServicePrice priceLkr={service.priceLkr} />
                    </p>
                  </div>

                  <BookingServiceArrow />
                </Link>
              </li>
            );
          })}
        </ul>

        {(cancellationPolicy || depositPolicy || bankTransferInstructions) && (
          <>
            <Separator className="bg-border/50" />
            <div className="px-4 pb-2 md:px-6 md:pb-3">
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
        label={primaryCtaLabel}
        variant="sticky"
      />
    </BlurFade>
  );
}
