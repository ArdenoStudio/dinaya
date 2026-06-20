"use client";

import Link from "next/link";
import Image from "next/image";
import { formatLkr, isOptimizableRemoteImage, cn } from "@/lib/utils";
import { buildServiceBookingPath } from "@/lib/booking-url";
import {
  formatHubLocationLine,
  hubTagline,
  serviceIconName,
} from "@/lib/booking-hub-present";
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
  hasTeam?: boolean;
  hasReviews?: boolean;
}

function serviceInitial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function HubQuickLinks({
  hasTeam,
  hasReviews,
  copy,
}: {
  hasTeam?: boolean;
  hasReviews?: boolean;
  copy: BookingCopy;
}) {
  if (!hasTeam && !hasReviews) return null;

  const linkClass =
    "text-sm font-medium text-[var(--booking-accent)] underline-offset-4 transition-opacity hover:underline";

  return (
    <nav
      aria-label="Booking page sections"
      className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
    >
      {hasReviews ? (
        <a href="#booking-hub-reviews" className={linkClass}>
          {copy.readReviews}
        </a>
      ) : null}
      {hasTeam && hasReviews ? (
        <span className="text-muted-foreground/60" aria-hidden>
          ·
        </span>
      ) : null}
      {hasTeam ? (
        <a href="#booking-hub-team" className={linkClass}>
          {copy.meetTeam}
        </a>
      ) : null}
    </nav>
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
  hasTeam,
  hasReviews,
}: Props) {
  if (services.length <= 1) return null;

  const rating = getBusinessRating(avgRating, reviewCount);
  const primaryService = services[0]!;
  const primaryHref = buildServiceBookingPath(
    businessSlug,
    primaryService.slug ?? primaryService.id,
  );
  const tagline = hubTagline(businessDescription, copy.selectServiceHint);
  const locationLine = formatHubLocationLine(businessAddress, businessPhone);
  const showHeaderAvatar = !heroImageUrl;

  const shell =
    "overflow-hidden rounded-none border-x-0 bg-card shadow-none md:rounded-2xl md:border md:border-border/80 md:shadow-[0_12px_40px_-24px_rgba(15,23,42,0.28)]";

  return (
    <BlurFade className="w-full">
      <article className={cn("flex w-full flex-col", shell)}>
        {heroImageUrl ? (
          <BookingHubHeroImage src={heroImageUrl} alt={businessName} />
        ) : null}

        <header className="flex flex-col gap-4 px-4 pb-3 pt-5 md:px-6 md:pt-6">
          <div className={cn("flex gap-4", showHeaderAvatar ? "items-start" : "flex-col")}>
            {showHeaderAvatar ? (
              <Avatar className="size-12 shrink-0 ring-2 ring-border/80" data-size="lg">
                {businessLogoUrl ? (
                  <AvatarImage
                    src={businessLogoUrl}
                    alt=""
                    className="bg-white object-contain p-1"
                  />
                ) : null}
                <AvatarFallback className="bg-[var(--booking-accent-muted)] text-base font-semibold text-[var(--booking-accent)]">
                  {serviceInitial(businessName)}
                </AvatarFallback>
              </Avatar>
            ) : null}

            <div className="min-w-0 flex-1">
              <h1 className="font-cal text-3xl font-bold leading-[1.1] tracking-tight text-foreground md:text-4xl">
                {businessName}
              </h1>
              <p className="mt-2 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {tagline}
              </p>
              {rating ? (
                <BusinessRating
                  avgRating={rating.avgRating}
                  reviewCount={rating.reviewCount}
                  copy={copy}
                  size="sm"
                  compactAttribution
                  className="mt-3"
                />
              ) : null}
              {locationLine ? (
                <p className="mt-2 flex items-start gap-1.5 text-sm text-foreground/75">
                  <Icon name="geo-alt" className="mt-0.5 shrink-0 text-muted-foreground" />
                  <span>{locationLine}</span>
                </p>
              ) : null}
              <div className="mt-3">
                <HubQuickLinks hasTeam={hasTeam} hasReviews={hasReviews} copy={copy} />
              </div>
            </div>
          </div>

          <div className="hidden items-center justify-between gap-4 border-t border-border/50 pt-4 md:flex">
            <p className="text-sm text-muted-foreground">
              {copy.chooseServiceAndTime}
              <span className="ml-2 text-foreground/60">· {services.length} services</span>
            </p>
            <BookingHubCta
              businessSlug={businessSlug}
              serviceSlug={primaryService.slug ?? primaryService.id}
              label={copy.chooseService}
              variant="inline"
            />
          </div>
        </header>

        <Separator className="opacity-60" />

        <ul className="flex flex-col gap-1.5 p-2 md:gap-2 md:p-3">
          {services.map((service) => {
            const href = buildServiceBookingPath(businessSlug, service.slug ?? service.id);
            const iconName = serviceIconName(service.name);

            return (
              <li key={service.id}>
                <Link
                  href={href}
                  className={cn(
                    "group flex min-h-[4.75rem] items-start gap-3.5 rounded-xl border border-transparent px-3 py-4 md:py-[1.125rem]",
                    "transition-[background-color,transform,box-shadow,border-color] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)]",
                    "hover:border-border/80 hover:bg-muted/60 hover:shadow-sm",
                    "active:scale-[0.985] md:hover:translate-y-[-1px]",
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
                      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground dark:text-zinc-400">
                        {service.description}
                      </p>
                    ) : null}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" className="gap-1 text-xs font-normal">
                        <Icon name="clock" className="text-[0.8rem]" />
                        {service.durationMinutes}m
                      </Badge>
                      {service.priceLkr > 0 ? (
                        <Badge variant="secondary" className="gap-1 text-xs font-medium">
                          <Icon name="cash-stack" className="text-[0.8rem]" />
                          {formatLkr(service.priceLkr)}
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Free
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Icon
                    name="chevron-right"
                    className="size-4 shrink-0 self-center text-muted-foreground/50 transition-transform duration-200 ease-out group-hover:translate-x-1 group-hover:text-[var(--booking-accent)]"
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
      />
    </BlurFade>
  );
}
