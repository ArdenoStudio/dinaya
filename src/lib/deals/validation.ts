import type { deals } from "@/db/schema";

export type DealRow = typeof deals.$inferSelect;

export class DealValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DealValidationError";
  }
}

export function isDealClaimable(deal: DealRow, now = new Date()): boolean {
  if (deal.status !== "active") return false;
  if (deal.slotsRedeemed >= deal.slotsTotal) return false;
  return now >= deal.dealWindowStart && now <= deal.dealWindowEnd;
}

export function isAppointmentInDealWindow(
  appointmentStart: Date,
  deal: Pick<DealRow, "apptWindowStart" | "apptWindowEnd">,
): boolean {
  return appointmentStart >= deal.apptWindowStart && appointmentStart <= deal.apptWindowEnd;
}

export function validateDealForBooking(input: {
  deal: DealRow;
  businessId: string;
  serviceId: string;
  staffId: string;
  locationId: string | null;
  appointmentStart: Date;
  now?: Date;
}): void {
  const { deal, businessId, serviceId, staffId, locationId, appointmentStart, now = new Date() } = input;

  if (deal.businessId !== businessId) {
    throw new DealValidationError("Deal does not belong to this business.");
  }
  if (deal.serviceId !== serviceId) {
    throw new DealValidationError("This deal applies to a different service.");
  }
  if (deal.staffId && deal.staffId !== staffId) {
    throw new DealValidationError("This deal applies to a different staff member.");
  }
  if (deal.locationId !== locationId) {
    throw new DealValidationError("This deal applies to a different location.");
  }
  if (!isDealClaimable(deal, now)) {
    if (deal.status === "sold_out" || deal.slotsRedeemed >= deal.slotsTotal) {
      throw new DealValidationError("This deal just sold out.");
    }
    throw new DealValidationError("This deal is no longer available.");
  }
  if (!isAppointmentInDealWindow(appointmentStart, deal)) {
    throw new DealValidationError("The selected time is outside this deal's appointment window.");
  }
}

export function getDealDisplayStatus(
  deal: Pick<DealRow, "status" | "dealWindowStart" | "dealWindowEnd" | "slotsRedeemed" | "slotsTotal">,
  now = new Date(),
): DealRow["status"] | "upcoming" {
  if (deal.status === "cancelled") return "cancelled";
  if (deal.status === "sold_out" || deal.slotsRedeemed >= deal.slotsTotal) return "sold_out";
  if (deal.status === "expired" || now > deal.dealWindowEnd) return "expired";
  if (now < deal.dealWindowStart) return "upcoming";
  return "active";
}

export function slotsRemaining(deal: Pick<DealRow, "slotsTotal" | "slotsRedeemed">): number {
  return Math.max(0, deal.slotsTotal - deal.slotsRedeemed);
}
