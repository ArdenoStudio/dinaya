"use client";

import { cn } from "@/lib/utils";
import type { BookingCopy } from "@/lib/i18n";
import { BookingBusinessAvatar } from "./BookingBusinessAvatar";
import { BusinessRating } from "./BusinessRating";

type IdentitySize = "sm" | "lg";

interface BookingBusinessIdentityProps {
  name: string;
  logoUrl?: string | null;
  copy: BookingCopy;
  subtitle?: string | null;
  meta?: string | null;
  rating?: { avgRating: number; reviewCount: number } | null;
  size?: IdentitySize;
  className?: string;
}

export function BookingBusinessIdentity({
  name,
  logoUrl,
  copy,
  subtitle,
  meta,
  rating,
  size = "sm",
  className,
}: BookingBusinessIdentityProps) {
  const isLarge = size === "lg";

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <BookingBusinessAvatar
        name={name}
        logoUrl={logoUrl}
        size={isLarge ? "lg" : "sm"}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h1
            className={cn(
              "truncate font-semibold tracking-tight text-foreground",
              isLarge ? "text-lg" : "text-sm",
            )}
          >
            {name}
          </h1>
          {rating ? (
            <BusinessRating
              avgRating={rating.avgRating}
              reviewCount={rating.reviewCount}
              copy={copy}
              size="sm"
              variant="pill"
              scrollToReviews
            />
          ) : null}
        </div>

        {subtitle ? (
          <p
            className={cn(
              "mt-1.5 text-muted-foreground",
              isLarge ? "text-sm leading-relaxed" : "text-xs leading-snug",
            )}
          >
            {subtitle}
          </p>
        ) : null}

        {meta ? (
          <p className="mt-2 text-xs text-muted-foreground/75 sm:hidden">{meta}</p>
        ) : null}
      </div>
    </div>
  );
}
