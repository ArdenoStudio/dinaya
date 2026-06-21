import { describe, expect, it } from "vitest";
import { getBookingCopy } from "@/lib/i18n";
import { buildBookingBreadcrumbItems } from "./booking-breadcrumb";
import type { BookingService } from "./BookingWizard";

const copy = getBookingCopy("en");

const service = {
  id: "svc-1",
  name: "Haircut",
  durationMinutes: 30,
  priceLkr: 1500,
} as BookingService;

describe("buildBookingBreadcrumbItems", () => {
  it("shows All services / service name when picking a time from the hub", () => {
    const items = buildBookingBreadcrumbItems({
      copy,
      service,
      showContactForm: false,
      hubHref: "/book/test",
      lockServiceSelection: true,
      multiService: true,
      onBackToServices: () => {},
      onBackToDateTime: () => {},
    });

    expect(items).toEqual([
      { label: "All services", href: "/book/test" },
      { label: "Haircut", current: true },
    ]);
  });

  it("shows All services / Date & time / Your details on the contact step", () => {
    const items = buildBookingBreadcrumbItems({
      copy,
      service,
      showContactForm: true,
      hubHref: "/book/test",
      lockServiceSelection: true,
      multiService: true,
      onBackToServices: () => {},
      onBackToDateTime: () => {},
    });

    expect(items).toEqual([
      { label: "All services", href: "/book/test" },
      { label: "Date & Time", onClick: expect.any(Function) },
      { label: "Your details", current: true },
    ]);
  });

  it("uses Choose a service when there is no hub link", () => {
    const items = buildBookingBreadcrumbItems({
      copy,
      service,
      showContactForm: false,
      hubHref: null,
      lockServiceSelection: false,
      multiService: true,
      onBackToServices: () => {},
      onBackToDateTime: () => {},
    });

    expect(items[0]).toEqual({ label: "Choose a service", onClick: expect.any(Function) });
    expect(items[1]).toEqual({ label: "Haircut", current: true });
  });
});
