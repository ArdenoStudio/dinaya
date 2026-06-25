import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Props = {
  children: ReactNode;
  className?: string;
  variant?: "hub" | "booker";
};

/** Themed loading shell — matches public booking page canvas while RSC loads. */
export function BookingLoadingShell({ children, className, variant = "booker" }: Props) {
  return (
    <div
      data-booking-theme=""
      className={cn(
        "booking-page-bg min-h-dvh",
        variant === "hub"
          ? "flex flex-col items-center pt-0 md:justify-center md:py-10"
          : "flex flex-col items-center md:justify-center md:py-10",
        className,
      )}
    >
      {children}
    </div>
  );
}
