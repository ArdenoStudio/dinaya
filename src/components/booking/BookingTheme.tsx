"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useTheme } from "next-themes";
import { buildBookingThemeStyle, type ResolvedBookingTheme } from "@/lib/booking-theme";

interface Props {
  theme: ResolvedBookingTheme;
  children: ReactNode;
  className?: string;
  embed?: boolean;
}

export function BookingTheme({ theme, children, className = "", embed }: Props) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div
      data-booking-theme=""
      data-booking-embed={embed ? "true" : undefined}
      className={className}
      style={buildBookingThemeStyle(theme, { isDark })}
    >
      {children}
    </div>
  );
}
