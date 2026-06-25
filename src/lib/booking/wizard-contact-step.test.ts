import { describe, expect, it } from "vitest";
import { shouldShowBookingContactForm } from "./wizard-contact-step";

describe("shouldShowBookingContactForm", () => {
  const base = {
    selectedSlot: { startUtc: "2026-06-24T10:00:00.000Z" },
    timeLabel: "10:00 AM",
    staff: { id: "s1" },
    anyStaff: false,
    needsLocationPicker: false,
    location: null,
  };

  it("shows contact when slot and time are chosen", () => {
    expect(shouldShowBookingContactForm(base)).toBe(true);
  });

  it("shows contact with any-staff mode", () => {
    expect(
      shouldShowBookingContactForm({
        ...base,
        staff: null,
        anyStaff: true,
      }),
    ).toBe(true);
  });

  it("stays on date-time without a selected slot", () => {
    expect(shouldShowBookingContactForm({ ...base, selectedSlot: null })).toBe(false);
  });

  it("stays on date-time without a time label", () => {
    expect(shouldShowBookingContactForm({ ...base, timeLabel: "" })).toBe(false);
  });

  it("does not hide contact when hold expires (slotUnavailable is separate)", () => {
    expect(shouldShowBookingContactForm(base)).toBe(true);
  });

  it("requires location when multi-branch", () => {
    expect(
      shouldShowBookingContactForm({
        ...base,
        needsLocationPicker: true,
        location: null,
      }),
    ).toBe(false);
    expect(
      shouldShowBookingContactForm({
        ...base,
        needsLocationPicker: true,
        location: { id: "loc1" },
      }),
    ).toBe(true);
  });
});
