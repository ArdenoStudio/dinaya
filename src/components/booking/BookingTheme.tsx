"use client";

import type { ReactNode } from "react";
import { buildBookingThemeStyle, type ResolvedBookingTheme } from "@/lib/booking-theme";

interface Props {
  theme: ResolvedBookingTheme;
  children: ReactNode;
  className?: string;
  embed?: boolean;
}

export function BookingTheme({ theme, children, className = "", embed }: Props) {
  return (
    <div
      data-booking-theme=""
      data-booking-embed={embed ? "true" : undefined}
      className={className}
      style={buildBookingThemeStyle(theme)}
    >
      {children}
    </div>
  );
}
