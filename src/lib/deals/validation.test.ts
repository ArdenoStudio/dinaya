import { describe, expect, it } from "vitest";
import {
  DealValidationError,
  getDealDisplayStatus,
  isAppointmentInDealWindow,
  isDealClaimable,
  slotsRemaining,
  validateDealForBooking,
  validateDealUpdate,
} from "./validation";

const baseDeal = {
  id: "deal-1",
  businessId: "biz-1",
  locationId: "loc-1",
  serviceId: "svc-1",
  staffId: null,
  discountPercent: 30,
  slotsTotal: 5,
  slotsRedeemed: 0,
  impressionCount: 0,
  dealWindowStart: new Date("2026-05-25T08:00:00Z"),
  dealWindowEnd: new Date("2026-05-25T20:00:00Z"),
  apptWindowStart: new Date("2026-05-25T10:00:00Z"),
  apptWindowEnd: new Date("2026-05-25T18:00:00Z"),
  status: "active" as const,
  createdAt: new Date("2026-05-24T00:00:00Z"),
};

describe("deal validation", () => {
  it("detects claimable deals within window", () => {
    expect(isDealClaimable(baseDeal, new Date("2026-05-25T12:00:00Z"))).toBe(true);
    expect(isDealClaimable(baseDeal, new Date("2026-05-25T07:00:00Z"))).toBe(false);
    expect(isDealClaimable({ ...baseDeal, status: "cancelled" }, new Date("2026-05-25T12:00:00Z"))).toBe(false);
  });

  it("checks appointment window boundaries", () => {
    expect(isAppointmentInDealWindow(new Date("2026-05-25T12:00:00Z"), baseDeal)).toBe(true);
    expect(isAppointmentInDealWindow(new Date("2026-05-25T09:00:00Z"), baseDeal)).toBe(false);
  });

  it("computes slots remaining", () => {
    expect(slotsRemaining({ slotsTotal: 5, slotsRedeemed: 2 })).toBe(3);
    expect(slotsRemaining({ slotsTotal: 5, slotsRedeemed: 5 })).toBe(0);
  });

  it("derives display status", () => {
    expect(getDealDisplayStatus(baseDeal, new Date("2026-05-24T12:00:00Z"))).toBe("upcoming");
    expect(getDealDisplayStatus(baseDeal, new Date("2026-05-25T12:00:00Z"))).toBe("active");
    expect(getDealDisplayStatus({ ...baseDeal, slotsRedeemed: 5 }, new Date("2026-05-25T12:00:00Z"))).toBe("sold_out");
  });

  it("validates deal booking constraints", () => {
    expect(() => validateDealForBooking({
      deal: baseDeal,
      businessId: "biz-1",
      serviceId: "svc-1",
      staffId: "staff-1",
      locationId: "loc-1",
      appointmentStart: new Date("2026-05-25T12:00:00Z"),
      now: new Date("2026-05-25T12:00:00Z"),
    })).not.toThrow();

    expect(() => validateDealForBooking({
      deal: baseDeal,
      businessId: "other-biz",
      serviceId: "svc-1",
      staffId: "staff-1",
      locationId: "loc-1",
      appointmentStart: new Date("2026-05-25T12:00:00Z"),
    })).toThrow(DealValidationError);

    expect(() => validateDealForBooking({
      deal: { ...baseDeal, slotsRedeemed: 5, status: "sold_out" },
      businessId: "biz-1",
      serviceId: "svc-1",
      staffId: "staff-1",
      locationId: "loc-1",
      appointmentStart: new Date("2026-05-25T12:00:00Z"),
    })).toThrow(/sold out/i);
  });

  it("validates deal updates", () => {
    expect(() => validateDealUpdate(baseDeal, {
      slotsTotal: 6,
      dealWindowEnd: new Date("2100-05-26T20:00:00Z"),
    })).not.toThrow();

    expect(() => validateDealUpdate({ ...baseDeal, slotsRedeemed: 2 }, { slotsTotal: 1 })).toThrow(DealValidationError);
    expect(() => validateDealUpdate({ ...baseDeal, status: "cancelled" }, { slotsTotal: 6 })).toThrow(/cancelled/i);
  });
});
