"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/Icon";
import { formatLkr } from "@/lib/utils";
import type { BookingService } from "./BookingWizard";
import { BookingStepIndicator } from "./BookingStepIndicator";

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
  description,
  onStepClick,
}: Props) {
  const hasRating = avgRating != null && reviewCount != null && reviewCount > 0;

  return (
    <div className="border-b border-border px-4 py-4 md:hidden">
      <div className="flex items-start gap-3">
        <Avatar className="size-10" data-size="lg">
          {logoUrl ? <AvatarImage src={logoUrl} alt={businessName} /> : null}
          <AvatarFallback className="bg-[var(--booking-accent-muted)] font-semibold text-[var(--booking-accent)]">
            {businessName.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
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
        </div>
        {hasRating && (
          <Badge variant="secondary" className="shrink-0 gap-1">
            <Icon name="star-fill" className="text-amber-400" />
            {avgRating.toFixed(1)}
          </Badge>
        )}
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
