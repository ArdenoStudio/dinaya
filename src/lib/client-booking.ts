import { db } from "@/db";
import { bookings, businesses, services, staff } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import { verifyClientBookingToken } from "@/lib/client-tokens";
import { normalizeSriLankanPhone } from "@/lib/phone";

export async function getClientBookingByToken(token: string) {
  const payload = verifyClientBookingToken(token);
  if (!payload) return null;

  const [row] = await db
    .select({
      id: bookings.id,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      clientEmail: bookings.clientEmail,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      status: bookings.status,
      notes: bookings.notes,
      businessId: bookings.businessId,
      serviceId: bookings.serviceId,
      minimumNoticeHours: services.minimumNoticeHours,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      businessPhone: businesses.phone,
      cancellationPolicy: businesses.cancellationPolicy,
      serviceName: services.name,
      staffName: staff.name,
    })
    .from(bookings)
    .innerJoin(businesses, eq(businesses.id, bookings.businessId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(staff, eq(staff.id, bookings.staffId))
    .where(eq(bookings.id, payload.bookingId))
    .limit(1);

  if (!row) return null;

  const normalizedPhone = normalizeSriLankanPhone(row.clientPhone);
  if (!normalizedPhone || normalizedPhone !== payload.clientPhone) {
    return null;
  }

  return row;
}

export function canClientCancelBooking(input: {
  startsAt: Date;
  status: string;
  minimumNoticeHours: number;
}): { allowed: boolean; reason?: string } {
  if (input.status === "cancelled") {
    return { allowed: false, reason: "This booking is already cancelled." };
  }

  if (input.status === "completed" || input.status === "no_show") {
    return { allowed: false, reason: "This booking can no longer be changed." };
  }

  const hoursUntil = (input.startsAt.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < input.minimumNoticeHours) {
    return {
      allowed: false,
      reason: `Cancellations must be made at least ${input.minimumNoticeHours} hours before the appointment.`,
    };
  }

  return { allowed: true };
}
