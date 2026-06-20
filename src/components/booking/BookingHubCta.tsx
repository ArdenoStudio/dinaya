"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buildServiceBookingPath } from "@/lib/booking-url";
import { Icon } from "@/components/ui/Icon";

type Props = {
  businessSlug: string;
  serviceSlug: string;
  label: string;
  variant: "inline" | "sticky";
  emphasis?: "primary" | "secondary";
  className?: string;
};

const primaryCtaClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-[var(--booking-accent)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-[background-color,transform,box-shadow] duration-200 ease-out hover:bg-[var(--booking-accent-hover)] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent-soft)] focus-visible:ring-offset-2";

const secondaryCtaClass =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-border bg-background/95 px-5 py-2.5 text-sm font-semibold text-foreground shadow-sm backdrop-blur-sm transition-[background-color,transform,border-color] duration-200 ease-out hover:border-border hover:bg-muted/80 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent-soft)] focus-visible:ring-offset-2";

export function BookingHubCta({
  businessSlug,
  serviceSlug,
  label,
  variant,
  emphasis = "primary",
  className,
}: Props) {
  const href = buildServiceBookingPath(businessSlug, serviceSlug);
  const ctaClass = emphasis === "secondary" ? secondaryCtaClass : primaryCtaClass;

  if (variant === "sticky") {
    return (
      <div
        className={cn(
          "pointer-events-none fixed inset-x-0 bottom-0 z-40 border-t border-border/50 bg-background/90 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-md md:hidden",
          className,
        )}
      >
        <Link href={href} className={cn("pointer-events-auto mx-auto flex w-full max-w-md", ctaClass)}>
          {label}
          <Icon name="arrow-right" className="text-sm" />
        </Link>
      </div>
    );
  }

  return (
    <Link href={href} className={cn(ctaClass, className)}>
      {label}
      <Icon name="arrow-right" className="text-sm" />
    </Link>
  );
}
