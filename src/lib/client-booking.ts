import { db } from "@/db";
import { bookings, businesses, services, staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyClientBookingToken } from "@/lib/client-tokens";
import { canModifyClientBooking } from "@/lib/booking-reschedule";
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
      staffId: bookings.staffId,
      minimumNoticeHours: services.minimumNoticeHours,
      maximumAdvanceDays: services.maximumAdvanceDays,
      durationMinutes: services.durationMinutes,
      beforeBuffer: services.beforeBuffer,
      afterBuffer: services.afterBuffer,
      dailyCapacity: services.dailyCapacity,
      priceLkr: services.priceLkr,
      requiresPayment: services.requiresPayment,
      depositPercent: services.depositPercent,
      serviceDescription: services.description,
      serviceName: services.name,
      serviceSlug: services.slug,
      serviceImageUrl: services.imageUrl,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      businessPhone: businesses.phone,
      businessLanguage: businesses.language,
      businessTimezone: businesses.timezone,
      cancellationPolicy: businesses.cancellationPolicy,
      staffName: staff.name,
      staffBio: staff.bio,
      staffAvatarUrl: staff.avatarUrl,
      staffIsActive: staff.isActive,
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
}) {
  return canModifyClientBooking({ ...input, action: "cancel" });
}

export function canClientRescheduleBooking(input: {
  startsAt: Date;
  status: string;
  minimumNoticeHours: number;
}) {
  return canModifyClientBooking({ ...input, action: "reschedule" });
}
