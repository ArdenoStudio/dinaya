"use client";

import Image from "next/image";
import { useState } from "react";
import {
  bookingLogoHasIntrinsicPadding,
  bookingLogoImageScale,
} from "@/lib/booking/logo-avatar";
import { cn, isOptimizableRemoteImage } from "@/lib/utils";

type AvatarSize = "sm" | "md" | "lg" | "hub" | "hubHero";

const sizeClasses: Record<AvatarSize, { box: string; text: string; pixels: number }> = {
  sm: { box: "size-10", text: "text-sm", pixels: 40 },
  md: { box: "size-12", text: "text-base", pixels: 48 },
  lg: { box: "size-14", text: "text-lg", pixels: 56 },
  hub: { box: "size-[5.5rem] md:size-24", text: "text-2xl", pixels: 96 },
  hubHero: { box: "size-20 md:size-[5.5rem]", text: "text-xl", pixels: 88 },
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
  const isHubSize = size === "hub" || size === "hubHero";

  if (showImage) {
    return (
      <div
        className={cn(
          dims.box,
          "relative shrink-0 overflow-hidden rounded-full bg-[var(--booking-accent-muted)] ring-1 ring-border/60",
          className,
        )}
      >
        {paddedLogo || isHubSize ? (
          <Image
            src={resolvedLogo}
            alt={name}
            fill
            sizes={`${dims.pixels}px`}
            className="bg-white object-cover object-center"
            style={{
              transform: `scale(${bookingLogoImageScale(resolvedLogo)})`,
            }}
            unoptimized={!isOptimizableRemoteImage(resolvedLogo)}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Image
            src={resolvedLogo}
            alt={name}
            fill
            sizes={`${dims.pixels}px`}
            className="bg-white object-contain p-0.5"
            unoptimized={!isOptimizableRemoteImage(resolvedLogo)}
            onError={() => setImageFailed(true)}
          />
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
