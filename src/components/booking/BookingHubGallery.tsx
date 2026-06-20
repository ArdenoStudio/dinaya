"use client";

import Image from "next/image";
import { isOptimizableRemoteImage } from "@/lib/utils";
import { BlurFade } from "@/components/ui/blur-fade";
import { Marquee } from "@/components/ui/marquee";

type Props = {
  images: string[];
  className?: string;
};

export function BookingHubGallery({ images, className }: Props) {
  if (images.length === 0) return null;

  return (
    <BlurFade className={className}>
      <div className="overflow-hidden rounded-none border-x-0 border-border/60 md:rounded-xl md:border">
        <Marquee pauseOnHover className="[--duration:50s] [--gap:0.5rem] p-1">
          {images.map((url) => (
            <div
              key={url}
              className="relative size-28 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-32"
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="128px"
                className="object-cover"
                loading="lazy"
                unoptimized={!isOptimizableRemoteImage(url)}
              />
            </div>
          ))}
        </Marquee>
      </div>
    </BlurFade>
  );
}
