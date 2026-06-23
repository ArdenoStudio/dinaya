"use client";

import { useState } from "react";
import Image from "next/image";
import { isOptimizableRemoteImage } from "@/lib/utils";

type Props = {
  src: string;
  alt: string;
};

export function BookingHubHeroImage({ src, alt }: Props) {
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
          className="object-cover object-top"
          unoptimized={!isOptimizableRemoteImage(src)}
          onError={() => setHidden(true)}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-card/85 via-card/10 to-transparent"
        />
      </div>
    </div>
  );
}
