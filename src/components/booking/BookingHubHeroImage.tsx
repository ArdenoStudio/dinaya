"use client";

import { useState } from "react";
import Image from "next/image";
import { isOptimizableRemoteImage } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
  onUnavailable?: () => void;
};

export function BookingHubHeroImage({ src, alt, onUnavailable }: Props) {
  const [hidden, setHidden] = useState(false);

  if (hidden) return null;

  return (
    <div className="relative w-full overflow-hidden bg-muted">
      <div className="relative aspect-[3/2] w-full md:max-h-[min(28rem,52vh)]">
        <Image
          src={src}
          alt={alt}
          fill
          priority
          sizes="(max-width: 768px) 100vw, 672px"
          className="object-cover object-top outline outline-1 -outline-offset-1 outline-black/10 dark:outline-white/10"
          unoptimized={!isOptimizableRemoteImage(src)}
          onError={() => {
            setHidden(true);
            onUnavailable?.();
          }}
        />
        <div aria-hidden className="booking-hero-overlay pointer-events-none absolute inset-0" />
      </div>
    </div>
  );
}
