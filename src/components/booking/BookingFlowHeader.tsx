"use client";

import { BookingBusinessAvatar } from "./BookingBusinessAvatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/Icon";
import type { BookingCopy } from "@/lib/i18n";
import { formatLkr } from "@/lib/utils";
import type { BookingService } from "./BookingWizard";
import { BookingStepIndicator } from "./BookingStepIndicator";
import { BusinessRating } from "./BusinessRating";
import { getBusinessRating } from "@/lib/booking/rating";

type Props = {
  businessName: string;
  logoUrl?: string | null;
  bookingUrlLabel: string;
  service: BookingService | null;
  steps: string[];
  currentStep: number;
  bookAppointmentLabel: string;
  avgRating?: number | null;
  reviewCount?: number;
  copy?: BookingCopy;
  description?: string | null;
  onStepClick?: (index: number) => void;
};

export function BookingFlowHeader({
  businessName,
  logoUrl,
  bookingUrlLabel,
  service,
  steps,
  currentStep,
  bookAppointmentLabel,
  avgRating,
  reviewCount,
  copy,
  description,
  onStepClick,
}: Props) {
  const rating = getBusinessRating(avgRating, reviewCount);

  return (
    <div className="border-b border-border px-4 py-4 md:hidden">
      <div className="flex items-start gap-3">
        <BookingBusinessAvatar name={businessName} logoUrl={logoUrl} className="size-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{businessName}</p>
          {service ? (
            <>
              <p className="mt-0.5 truncate text-base font-semibold text-foreground">{service.name}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  <Icon name="clock" />
                  {service.durationMinutes}m
                </Badge>
                {service.priceLkr > 0 ? (
                  <Badge variant="outline">{formatLkr(service.priceLkr)}</Badge>
                ) : (
                  <Badge variant="outline">Free</Badge>
                )}
              </div>
            </>
          ) : (
            <>
              <p className="mt-0.5 text-sm text-muted-foreground">{bookAppointmentLabel}</p>
              {description ? (
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{description}</p>
              ) : null}
            </>
          )}
          <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
            <Icon name="lock-fill" className="text-[10px]" />
            {bookingUrlLabel}
          </p>
          {rating && copy ? (
            <BusinessRating
              avgRating={rating.avgRating}
              reviewCount={rating.reviewCount}
              copy={copy}
              size="sm"
              scrollToReviews
              className="mt-2"
            />
          ) : null}
        </div>
      </div>
      <BookingStepIndicator
        steps={steps}
        current={currentStep}
        className="mt-4"
        onStepClick={onStepClick}
      />
    </div>
  );
}
