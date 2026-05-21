/** Stable element IDs for docs walkthrough highlights (attach cursor to real mockup nodes). */

export const DASHBOARD_TARGETS = [
  "onboarding-business-info",
  "marketing-booking-link",
  "marketing-copy-link",
  "marketing-qr-code",
  "marketing-whatsapp",
  "marketing-directory",
  "marketing-embed",
  "availability-weekly-hours",
  "availability-blocked-dates",
  "services-add-service",
  "services-row",
  "bookings-new-booking",
  "bookings-row",
  "bookings-reschedule",
  "bookings-cancel",
  "bookings-refund",
  "billing-upgrade",
  "integrations-connect",
] as const;

export const BOOKING_TARGETS = [
  "booking-service-card",
  "booking-time-slot",
  "booking-confirm-pay",
  "booking-stars",
  "booking-reschedule",
  "booking-cancel",
] as const;

export type DashboardMockupTarget = (typeof DASHBOARD_TARGETS)[number];
export type BookingMockupTarget = (typeof BOOKING_TARGETS)[number];
export type DocsMockupTarget = DashboardMockupTarget | BookingMockupTarget;

export function isBookingTarget(target: string): target is BookingMockupTarget {
  return (BOOKING_TARGETS as readonly string[]).includes(target);
}
