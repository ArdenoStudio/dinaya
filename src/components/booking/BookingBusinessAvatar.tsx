"use client";

import Image from "next/image";
import { useState } from "react";
import { bookingLogoHasIntrinsicPadding } from "@/lib/booking/logo-avatar";
import { cn, isOptimizableRemoteImage } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg";

const sizeClasses: Record<AvatarSize, { box: string; text: string; pixels: number }> = {
  sm: { box: "size-10", text: "text-sm", pixels: 40 },
  md: { box: "size-12", text: "text-base", pixels: 48 },
  lg: { box: "size-14", text: "text-lg", pixels: 56 },
};

interface BookingBusinessAvatarProps {
  name: string;
  logoUrl?: string | null;
  size?: AvatarSize;
  className?: string;
}

export function BookingBusinessAvatar({
  name,
  logoUrl,
  size = "md",
  className,
}: BookingBusinessAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const trimmedName = name.trim();
  const initial = trimmedName ? trimmedName.charAt(0).toUpperCase() : "?";
  const resolvedLogo = logoUrl?.trim() ?? "";
  const showImage = Boolean(resolvedLogo) && !imageFailed;
  const dims = sizeClasses[size];
  const paddedLogo = bookingLogoHasIntrinsicPadding(resolvedLogo);

  if (showImage) {
    return (
      <div
        className={cn(
          dims.box,
          "relative shrink-0 overflow-hidden rounded-full bg-[var(--booking-accent-muted)] ring-1 ring-border/60",
          className,
        )}
      >
        {paddedLogo ? (
          <Image
            src={resolvedLogo}
            alt={name}
            fill
            sizes={`${dims.pixels}px`}
            className="object-cover object-center scale-[1.85]"
            unoptimized={!isOptimizableRemoteImage(resolvedLogo)}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-1.5">
            <Image
              src={resolvedLogo}
              alt={name}
              width={Math.round(dims.pixels * 0.82)}
              height={Math.round(dims.pixels * 0.82)}
              className="max-h-full max-w-full object-contain"
              unoptimized={!isOptimizableRemoteImage(resolvedLogo)}
              onError={() => setImageFailed(true)}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        dims.box,
        "booking-gradient-accent booking-shadow-accent flex shrink-0 items-center justify-center rounded-full font-bold text-white",
        dims.text,
        className,
      )}
      aria-hidden
    >
      {initial}
    </div>
  );
}
