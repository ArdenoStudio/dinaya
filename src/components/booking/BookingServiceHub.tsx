"use client";

import Link from "next/link";
import Image from "next/image";
import { formatLkr, isOptimizableRemoteImage } from "@/lib/utils";
import { buildServiceBookingPath } from "@/lib/booking-url";
import { Icon } from "@/components/ui/Icon";
import { BookingBusinessAvatar } from "./BookingBusinessAvatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BusinessRating } from "./BusinessRating";
import { getBusinessRating } from "@/lib/booking/rating";
import type { BookingCopy } from "@/lib/i18n";
import type { BookingService } from "./BookingWizard";

interface Props {
  businessSlug: string;
  businessName: string;
  businessLogoUrl?: string | null;
  services: BookingService[];
  copy: BookingCopy;
  avgRating?: number | null;
  reviewCount?: number;
}

export default function BookingServiceHub({
  businessSlug,
  businessName,
  businessLogoUrl,
  services,
  copy,
  avgRating,
  reviewCount,
}: Props) {
  if (services.length <= 1) return null;

  const rating = getBusinessRating(avgRating, reviewCount);

  const cardClass =
    "overflow-hidden rounded-none border-x-0 shadow-none md:rounded-xl md:border md:border-border md:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]";

  return (
    <div className="flex w-full flex-col gap-4 md:gap-5">
      <Card className={cardClass}>
        <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-4">
          <BookingBusinessAvatar
            name={businessName}
            logoUrl={businessLogoUrl}
            className="size-14"
            imageClassName="p-1"
            fallbackClassName="text-lg font-bold"
          />
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-xl">{businessName}</CardTitle>
            <CardDescription>{copy.chooseServiceAndTime}</CardDescription>
            {rating && (
              <BusinessRating
                avgRating={rating.avgRating}
                reviewCount={rating.reviewCount}
                copy={copy}
                size="sm"
                scrollToReviews
                className="pt-1"
              />
            )}
          </div>
          <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
            {services.length} services
          </Badge>
        </CardHeader>
      </Card>

      <Card className={cardClass}>
        <CardContent className="p-0">
          {services.map((service, index) => {
            const href = buildServiceBookingPath(businessSlug, service.slug ?? service.id);
            const depositAmount =
              service.depositPercent > 0
                ? Math.ceil((service.priceLkr * service.depositPercent) / 100)
                : service.priceLkr;

            return (
              <div key={service.id}>
                {index > 0 ? <Separator /> : null}
                <Link
                  href={href}
                  className="group flex items-start gap-4 px-4 py-4 transition-colors hover:bg-muted/50 md:px-5"
                >
                  {service.imageUrl ? (
                    <Image
                      src={service.imageUrl}
                      alt=""
                      width={48}
                      height={48}
                      className="size-12 shrink-0 rounded-lg object-cover"
                      unoptimized={!isOptimizableRemoteImage(service.imageUrl)}
                    />
                  ) : (
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-[var(--booking-accent-muted)] text-sm font-bold text-[var(--booking-accent)]">
                      {service.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground group-hover:text-[var(--booking-accent)]">
                      {service.name}
                    </p>
                    {service.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        <Icon name="clock" />
                        {service.durationMinutes}m
                      </Badge>
                      {service.priceLkr > 0 ? (
                        <Badge variant="outline">
                          <Icon name="cash-coin" />
                          {formatLkr(service.priceLkr)}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Free</Badge>
                      )}
                      {service.requiresPayment && service.depositPercent > 0 && service.priceLkr > 0 ? (
                        <Badge variant="outline">
                          <Icon name="shield-check" />
                          {copy.depositDue}: {formatLkr(depositAmount)}
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                  <Icon
                    name="chevron-right"
                    className="mt-1 shrink-0 text-muted-foreground/60 transition-colors group-hover:text-[var(--booking-accent)]"
                  />
                </Link>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
