import { describe, expect, it } from "vitest";
import {
  getDealDisplayStatus,
  isAppointmentInDealWindow,
  isDealClaimable,
  slotsRemaining,
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
});
