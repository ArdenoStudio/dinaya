"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "motion/react";
import { formatLkr, isOptimizableRemoteImage, cn } from "@/lib/utils";
import { buildServiceBookingPath } from "@/lib/booking-url";
import { BOOKING_HUB_COLORS } from "@/lib/booking-hub-brand";
import { Icon } from "@/components/ui/Icon";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BlurFade } from "@/components/ui/blur-fade";
import { MagicCard } from "@/components/ui/magic-card";
import { AnimatedGradientText } from "@/components/ui/animated-gradient-text";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { BorderBeam } from "@/components/ui/border-beam";
import { ShineBorder } from "@/components/ui/shine-border";
import { BusinessRating, getBusinessRating } from "./BusinessRating";
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

function pickPopularServiceIndex(services: BookingService[]): number {
  if (services.length <= 1) return 0;
  let bestIdx = 0;
  let bestPrice = services[0]!.priceLkr;
  for (let i = 1; i < services.length; i++) {
    const price = services[i]!.priceLkr;
    if (price > bestPrice) {
      bestPrice = price;
      bestIdx = i;
    }
  }
  return bestIdx;
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
  const popularIndex = pickPopularServiceIndex(services);

  const cardShell =
    "overflow-hidden rounded-none border-x-0 shadow-none md:rounded-xl md:border md:border-border md:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)]";

  return (
    <div className="flex w-full flex-col gap-4 md:gap-5">
      <BlurFade>
        <MagicCard
          className={cardShell}
          gradientFrom={BOOKING_HUB_COLORS.gradientFrom}
          gradientTo={BOOKING_HUB_COLORS.gradientTo}
          gradientColor="hsl(var(--muted))"
        >
          <CardHeader className="relative flex flex-row items-start gap-4 space-y-0 bg-card pb-4">
            <Avatar className="size-14" data-size="lg">
              {businessLogoUrl ? (
                <AvatarImage
                  src={businessLogoUrl}
                  alt={businessName}
                  className="bg-white object-contain p-1"
                />
              ) : null}
              <AvatarFallback className="bg-[var(--booking-accent-muted)] text-lg font-bold text-[var(--booking-accent)]">
                {businessName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-1.5">
              <CardTitle className="text-xl">
                <AnimatedGradientText
                  colorFrom={BOOKING_HUB_COLORS.gradientFrom}
                  colorTo={BOOKING_HUB_COLORS.gradientTo}
                  className="font-cal font-semibold"
                >
                  {businessName}
                </AnimatedGradientText>
              </CardTitle>
              <CardDescription>{copy.chooseServiceAndTime}</CardDescription>
              {rating ? (
                <BusinessRating
                  avgRating={rating.avgRating}
                  reviewCount={rating.reviewCount}
                  copy={copy}
                  size="sm"
                  animateCount
                  className="pt-1"
                />
              ) : null}
              <div className="flex items-center gap-2 pt-0.5">
                <span
                  className="size-2 shrink-0 rounded-full bg-emerald-500 motion-safe:animate-pulse"
                  aria-hidden
                />
                <AnimatedShinyText className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                  {copy.availableToday}
                </AnimatedShinyText>
              </div>
            </div>
            <Badge variant="secondary" className="hidden shrink-0 sm:inline-flex">
              {services.length} services
            </Badge>
          </CardHeader>
        </MagicCard>
      </BlurFade>

      <div className="flex flex-col gap-3 px-0 md:gap-3.5">
        {services.map((service, index) => {
          const href = buildServiceBookingPath(businessSlug, service.slug ?? service.id);
          const depositAmount =
            service.depositPercent > 0
              ? Math.ceil((service.priceLkr * service.depositPercent) / 100)
              : service.priceLkr;
          const isPopular = index === popularIndex;

          return (
            <BlurFade key={service.id} delay={index * 0.06}>
              <div
                className={cn(
                  "group relative overflow-hidden rounded-none border-x-0 border-border bg-card md:rounded-xl md:border md:shadow-sm",
                  cardShell,
                )}
              >
                <GlowingEffect
                  disabled={false}
                  spread={28}
                  proximity={48}
                  borderWidth={1}
                />
                {isPopular ? (
                  <>
                    <BorderBeam
                      size={80}
                      duration={8}
                      colorFrom={BOOKING_HUB_COLORS.borderBeamFrom}
                      colorTo={BOOKING_HUB_COLORS.borderBeamTo}
                    />
                    <ShineBorder
                      shineColor={[...BOOKING_HUB_COLORS.shineBorder]}
                      borderWidth={1}
                      duration={12}
                    />
                  </>
                ) : null}
                <Link
                  href={href}
                  className="relative z-10 flex min-h-[4.75rem] items-start gap-4 px-4 py-4 transition-colors hover:bg-muted/40 md:px-5"
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
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-foreground group-hover:text-[var(--booking-accent)]">
                        {service.name}
                      </p>
                      {isPopular ? (
                        <Badge className="border-0 bg-primary/10 text-primary hover:bg-primary/15">
                          Popular
                        </Badge>
                      ) : null}
                    </div>
                    {service.description ? (
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {service.description}
                      </p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">
                        <Icon name="clock" />
                        {service.durationMinutes}m
                      </Badge>
                      {service.priceLkr > 0 ? (
                        <Badge
                          variant="outline"
                          className="border-amber-200/80 text-amber-800 dark:border-amber-800/50 dark:text-amber-300"
                        >
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
                  <motion.span
                    className="mt-1 shrink-0 text-muted-foreground/60"
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 20 }}
                  >
                    <Icon
                      name="chevron-right"
                      className="transition-colors group-hover:text-[var(--booking-accent)]"
                    />
                  </motion.span>
                </Link>
              </div>
            </BlurFade>
          );
        })}
      </div>
    </div>
  );
}
