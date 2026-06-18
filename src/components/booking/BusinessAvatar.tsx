"use client";

import Image from "next/image";
import { Icon } from "@/components/ui/Icon";
import { isOptimizableRemoteImage } from "@/lib/utils";

interface BusinessAvatarProps {
  name: string;
  logoUrl?: string | null;
  icon?: string | null;
  size: "md" | "lg";
  onDark?: boolean;
}

export function BusinessAvatar({ name, logoUrl, icon, size, onDark }: BusinessAvatarProps) {
  const dim = size === "lg" ? "size-12 rounded-xl" : "size-[42px] rounded-[13px]";
  if (logoUrl) {
    const pixelSize = size === "lg" ? 48 : 42;
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={pixelSize}
        height={pixelSize}
        className={`${dim} shrink-0 object-cover ${onDark ? "ring-2 ring-white/30" : "ring-1 ring-white/25"}`}
        unoptimized={!isOptimizableRemoteImage(logoUrl)}
      />
    );
  }
  return (
    <div
      className={`${dim} flex shrink-0 items-center justify-center shadow-lg ${
        onDark
          ? "bg-white/20 ring-2 ring-white/30 backdrop-blur-sm"
          : "booking-gradient-accent booking-shadow-accent"
      }`}
    >
      {icon ? (
        <Icon name={icon} className={`text-white ${size === "lg" ? "text-xl" : "text-[18px]"}`} />
      ) : (
        <span className={`font-bold text-white ${size === "lg" ? "text-xl" : "text-lg"}`}>
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}
