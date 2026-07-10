import type { BookingPageBackground, BookingPanelBackground } from "@/lib/booking-theme";

export function isSolidBookingTheme(
  pageBackground: BookingPageBackground,
  panelBackground: BookingPanelBackground,
): boolean {
  return pageBackground === "accent" && panelBackground === "accent";
}

export function applySolidBookingTheme(solid: boolean): {
  bookingPageBackground: BookingPageBackground;
  bookingPanelBackground: BookingPanelBackground;
} {
  if (solid) {
    return { bookingPageBackground: "accent", bookingPanelBackground: "accent" };
  }
  return { bookingPageBackground: "white", bookingPanelBackground: "white" };
}
