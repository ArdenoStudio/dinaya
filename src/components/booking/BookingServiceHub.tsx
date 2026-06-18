"use client";

import Link from "next/link";
import { formatLkr } from "@/lib/utils";
import { buildServiceBookingPath } from "@/lib/booking-url";
import { Icon } from "@/components/ui/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
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
    <div className="mx-4 mb-4 space-y-4 md:mx-auto md:mb-6 md:max-w-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center gap-4 space-y-0 pb-4">
          <Avatar className="size-14" data-size="lg">
            {businessLogoUrl ? (
              <AvatarImage src={businessLogoUrl} alt={businessName} />
            ) : null}
            <AvatarFallback className="bg-[var(--booking-accent-muted)] text-lg font-bold text-[var(--booking-accent)]">
              {businessName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 space-y-1">
            <CardTitle className="truncate text-xl">{businessName}</CardTitle>
            <CardDescription>{copy.chooseService}</CardDescription>
          </div>
          <Badge variant="secondary" className="ml-auto hidden shrink-0 sm:inline-flex">
            {services.length} {services.length === 1 ? "service" : "services"}
          </Badge>
        </CardHeader>
      </Card>

      <Card className="overflow-hidden py-0">
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
                  className="group flex items-start justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
                >
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
