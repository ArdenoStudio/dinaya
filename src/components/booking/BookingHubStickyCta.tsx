"use client";

import Link from "next/link";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { buildServiceBookingPath } from "@/lib/booking-url";

type Props = {
  businessSlug: string;
  serviceSlug: string;
  label: string;
};

export function BookingHubStickyCta({ businessSlug, serviceSlug, label }: Props) {
  const href = buildServiceBookingPath(businessSlug, serviceSlug);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] md:hidden">
      <Link href={href} className="pointer-events-auto mx-auto block max-w-md">
        <InteractiveHoverButton
          type="button"
          className="w-full border-amber-300/60 bg-amber-500 font-semibold text-white shadow-lg hover:border-amber-400 [&_.bg-primary]:bg-amber-200 [&_span]:text-white [&_svg]:text-white"
        >
          {label}
        </InteractiveHoverButton>
      </Link>
    </div>
  );
}
