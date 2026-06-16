"use client";

import type { ReactNode } from "react";
import { buildBookingThemeStyle } from "@/lib/booking-theme";

interface Props {
  accentColor?: string | null;
  children: ReactNode;
  className?: string;
  embed?: boolean;
}

export function BookingTheme({ accentColor, children, className = "", embed }: Props) {
  return (
    <div
      data-booking-theme=""
      data-booking-embed={embed ? "true" : undefined}
      className={className}
      style={buildBookingThemeStyle(accentColor)}
    >
      {children}
    </div>
  );
}
