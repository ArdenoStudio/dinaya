"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { isOptimizableRemoteImage } from "@/lib/utils";

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
  const showImage = Boolean(logoUrl?.trim()) && !imageFailed;
  const dims = sizeClasses[size];

  if (showImage) {
    return (
      <div
        className={cn(
          dims.box,
          "relative shrink-0 overflow-hidden rounded-full bg-[var(--booking-accent-muted)] ring-1 ring-border/60",
          className,
        )}
      >
        <Image
          src={logoUrl!}
          alt={name}
          width={dims.pixels}
          height={dims.pixels}
          className="size-full object-contain p-1.5"
          unoptimized={!isOptimizableRemoteImage(logoUrl!)}
          onError={() => setImageFailed(true)}
        />
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
