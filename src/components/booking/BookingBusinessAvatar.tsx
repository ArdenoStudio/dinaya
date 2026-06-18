"use client";

import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface BookingBusinessAvatarProps {
  name: string;
  logoUrl?: string | null;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
}

export function BookingBusinessAvatar({
  name,
  logoUrl,
  className,
  imageClassName,
  fallbackClassName,
}: BookingBusinessAvatarProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const trimmedName = name.trim();
  const initial = trimmedName ? trimmedName.charAt(0).toUpperCase() : "?";
  const showImage = Boolean(logoUrl?.trim()) && !imageFailed;

  return (
    <Avatar className={className} data-size="lg">
      {showImage ? (
        <AvatarImage
          src={logoUrl!}
          alt={name}
          className={cn("object-contain bg-white p-0.5", imageClassName)}
          onLoadingStatusChange={(status) => {
            if (status === "error") setImageFailed(true);
          }}
        />
      ) : null}
      <AvatarFallback
        className={cn(
          "bg-[var(--booking-accent-muted)] text-sm font-semibold text-[var(--booking-accent)]",
          fallbackClassName,
        )}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
}
