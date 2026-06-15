import { db } from "@/db";
import {
  availability,
  availabilityOverrides,
  bookings,
  businesses,
  services,
  staff,
} from "@/db/schema";
import { and, eq, gt, inArray, lt, ne } from "drizzle-orm";
import { getAvailableSlots } from "@/lib/availability";
import { isRequestedSlotAvailable } from "@/lib/booking-availability";
import { buildClientBookingUrl } from "@/lib/client-tokens";
import { sendBookingRescheduleMessage } from "@/lib/messaging/booking-messages";
import { logActivity } from "@/lib/activity-log";
import { dispatchWebhooks } from "@/lib/webhooks";
import type { Plan } from "@/lib/plan";
import type { BookingLanguage } from "@/lib/i18n";
import { processBookingAutomationTrigger } from "@/lib/automations/engine";

export type RescheduleResult =
  | { ok: true; booking: { id: string; startsAt: Date; endsAt: Date; status: string } }
  | { ok: false; error: string; status: number };

function isOverlapConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; cause?: { code?: string } };
  return maybe.code === "23P01" || maybe.cause?.code === "23P01";
}

export function canModifyClientBooking(input: {
  startsAt: Date;
  status: string;
  minimumNoticeHours: number;
  action: "cancel" | "reschedule";
}): { allowed: boolean; reason?: string } {
  if (input.status === "cancelled") {
    return { allowed: false, reason: "This booking is already cancelled." };
  }

  if (input.status === "completed" || input.status === "no_show") {
    return { allowed: false, reason: "This booking can no longer be changed." };
  }

  const hoursUntil = (input.startsAt.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < input.minimumNoticeHours) {
    const verb = input.action === "cancel" ? "Cancellations" : "Changes";
    return {
      allowed: false,
      reason: `${verb} must be made at least ${input.minimumNoticeHours} hours before the appointment.`,
    };
  }

  return { allowed: true };
}

export async function getRescheduleSlots(input: {
  bookingId: string;
  date: string;
}) {
  const [booking] = await db
    .select({
      id: bookings.id,
      staffId: bookings.staffId,
      serviceId: bookings.serviceId,
      businessId: bookings.businessId,
      status: bookings.status,
      startsAt: bookings.startsAt,
      durationMinutes: services.durationMinutes,
      beforeBuffer: services.beforeBuffer,
      afterBuffer: services.afterBuffer,
      minimumNoticeHours: services.minimumNoticeHours,
      maximumAdvanceDays: services.maximumAdvanceDays,
      timezone: businesses.timezone,
    })
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(businesses, eq(businesses.id, bookings.businessId))
    .where(eq(bookings.id, input.bookingId))
    .limit(1);

  if (!booking) return null;

  const modifyCheck = canModifyClientBooking({
    startsAt: booking.startsAt,
    status: booking.status,
    minimumNoticeHours: booking.minimumNoticeHours,
    action: "reschedule",
  });
  if (!modifyCheck.allowed) {
    return { booking, slots: [], blockedReason: modifyCheck.reason };
  }

  const [staffAvailability, overrides, existingBookings] = await Promise.all([
    db.select().from(availability).where(eq(availability.staffId, booking.staffId)),
    db.select().from(availabilityOverrides).where(eq(availabilityOverrides.staffId, booking.staffId)),
    db
      .select({
        id: bookings.id,
        startsAt: bookings.startsAt,
        endsAt: bookings.endsAt,
        status: bookings.status,
      })
      .from(bookings)
      .where(and(
        eq(bookings.staffId, booking.staffId),
        ne(bookings.id, booking.id),
        inArray(bookings.status, ["pending", "confirmed"]),
      )),
  ]);

  const slots = getAvailableSlots({
    date: input.date,
    durationMinutes: booking.durationMinutes,
    beforeBuffer: booking.beforeBuffer,
    afterBuffer: booking.afterBuffer,
    minimumNoticeHours: booking.minimumNoticeHours,
    maximumAdvanceDays: booking.maximumAdvanceDays ?? 0,
    staffAvailability,
    overrides,
    existingBookings,
    timezone: booking.timezone ?? "Asia/Colombo",
  });

  return { booking, slots, blockedReason: undefined };
}

export async function rescheduleBooking(input: {
  bookingId: string;
  businessId?: string;
  startsAt: Date;
  endsAt: Date;
  source: "client_portal" | "dashboard";
  actorUserId?: string;
}): Promise<RescheduleResult> {
  const [row] = await db
    .select({
      id: bookings.id,
      businessId: bookings.businessId,
      clientId: bookings.clientId,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      clientEmail: bookings.clientEmail,
      staffId: bookings.staffId,
      status: bookings.status,
      startsAt: bookings.startsAt,
      endsAt: bookings.endsAt,
      serviceName: services.name,
      durationMinutes: services.durationMinutes,
      minimumNoticeHours: services.minimumNoticeHours,
      maximumAdvanceDays: services.maximumAdvanceDays,
      beforeBuffer: services.beforeBuffer,
      afterBuffer: services.afterBuffer,
      staffName: staff.name,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      businessPlan: businesses.plan,
      businessLanguage: businesses.language,
      businessTimezone: businesses.timezone,
    })
    .from(bookings)
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(staff, eq(staff.id, bookings.staffId))
    .innerJoin(businesses, eq(businesses.id, bookings.businessId))
    .where(eq(bookings.id, input.bookingId))
    .limit(1);

  if (!row) {
    return { ok: false, error: "Booking not found.", status: 404 };
  }

  if (input.businessId && row.businessId !== input.businessId) {
    return { ok: false, error: "Booking not found.", status: 404 };
  }

  if (row.status === "cancelled" || row.status === "completed" || row.status === "no_show") {
    return { ok: false, error: "This booking can no longer be changed.", status: 400 };
  }

  if (input.source === "client_portal") {
    const modifyCheck = canModifyClientBooking({
      startsAt: row.startsAt,
      status: row.status,
      minimumNoticeHours: row.minimumNoticeHours,
      action: "reschedule",
    });
    if (!modifyCheck.allowed) {
      return { ok: false, error: modifyCheck.reason ?? "Cannot reschedule this booking.", status: 400 };
    }
  }

  const expectedEnd = new Date(input.startsAt.getTime() + row.durationMinutes * 60_000);
  if (Math.abs(expectedEnd.getTime() - input.endsAt.getTime()) > 60_000) {
    return { ok: false, error: "Selected time does not match the service duration.", status: 400 };
  }

  // Client-portal reschedules must land on a slot the booking page would offer
  // (working hours, blocked days, minimum notice, no past times). Dashboard
  // reschedules by staff may move bookings freely.
  if (input.source === "client_portal") {
    const slotAvailable = await isRequestedSlotAvailable({
      staffId: row.staffId,
      start: input.startsAt,
      durationMinutes: row.durationMinutes,
      beforeBuffer: row.beforeBuffer,
      afterBuffer: row.afterBuffer,
      minimumNoticeHours: row.minimumNoticeHours,
      maximumAdvanceDays: row.maximumAdvanceDays ?? undefined,
      timezone: row.businessTimezone,
      excludeBookingId: row.id,
    });
    if (!slotAvailable) {
      return { ok: false, error: "That time isn't available. Please pick another slot.", status: 409 };
    }
  }

  const conflict = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(and(
      eq(bookings.staffId, row.staffId),
      ne(bookings.id, row.id),
      inArray(bookings.status, ["pending", "confirmed"]),
      lt(bookings.startsAt, input.endsAt),
      gt(bookings.endsAt, input.startsAt),
    ))
    .limit(1);

  if (conflict.length > 0) {
    return { ok: false, error: "This slot was just taken. Please pick another time.", status: 409 };
  }

  try {
    const [updated] = await db
      .update(bookings)
      .set({
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        reminderSentAt: null,
      })
      .where(eq(bookings.id, row.id))
      .returning({
        id: bookings.id,
        startsAt: bookings.startsAt,
        endsAt: bookings.endsAt,
        status: bookings.status,
      });

    if (!updated) {
      return { ok: false, error: "Could not update booking.", status: 500 };
    }

    void logActivity({
      action: "rescheduled",
      actorUserId: input.actorUserId,
      businessId: row.businessId,
      entity: "booking",
      entityId: row.id,
      meta: {
        source: input.source,
        from: row.startsAt.toISOString(),
        to: updated.startsAt.toISOString(),
      },
    }).catch((error) => {
      console.error("Activity log write failed:", error);
    });

    void dispatchWebhooks(row.businessId, "booking.rescheduled", {
      bookingId: updated.id,
      status: updated.status,
      clientName: row.clientName,
      clientPhone: row.clientPhone,
      serviceName: row.serviceName,
      startsAt: updated.startsAt.toISOString(),
      endsAt: updated.endsAt.toISOString(),
    });

    await sendBookingRescheduleMessage({
      businessId: row.businessId,
      bookingId: row.id,
      clientId: row.clientId,
      clientName: row.clientName,
      clientEmail: row.clientEmail,
      clientPhone: row.clientPhone,
      businessName: row.businessName,
      serviceName: row.serviceName,
      staffName: row.staffName,
      startsAt: updated.startsAt,
      manageUrl: buildClientBookingUrl({
        bookingId: row.id,
        clientPhone: row.clientPhone,
      }),
      plan: row.businessPlan as Plan,
      language: row.businessLanguage as BookingLanguage,
    });

    void processBookingAutomationTrigger(row.businessId, row.id, "booking.rescheduled").catch((error) => {
      console.error("Automation trigger failed:", error);
    });

    return { ok: true, booking: updated };
  } catch (error) {
    if (isOverlapConstraintError(error)) {
      return { ok: false, error: "This slot was just taken. Please pick another time.", status: 409 };
    }
    throw error;
  }
}
