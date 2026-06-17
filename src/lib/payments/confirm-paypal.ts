import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { bookings, businesses, payments, services, staff } from "@/db/schema";
import { logActivity } from "@/lib/activity-log";
import { runAfterResponse, logRejectedSettled } from "@/lib/after-response";
import { processBookingAutomationTrigger } from "@/lib/automations/engine";
import { buildClientBookingUrl } from "@/lib/client-tokens";
import { sendBookingConfirmationMessage, sendBookingNotificationToBusinessMessage } from "@/lib/messaging/booking-messages";
import { sendBookingNotificationToBusiness } from "@/lib/resend";
import { capturePaypalOrder } from "@/lib/payments/providers/paypal";
import { sendPaymentReceiptEmail } from "@/lib/receipts";
import { decryptSecret } from "@/lib/secrets";
import type { Plan } from "@/lib/plan";
import type { BookingLanguage } from "@/lib/i18n";

export type PaypalConfirmResult =
  | { ok: true; duplicate?: boolean }
  | { ok: false; error: string; status: number };

export async function confirmPaypalPayment(input: {
  bookingId: string;
  orderId: string;
}): Promise<PaypalConfirmResult> {
  const [row] = await db
    .select({
      bookingId: bookings.id,
      bookingStatus: bookings.status,
      businessId: bookings.businessId,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      clientEmail: bookings.clientEmail,
      startsAt: bookings.startsAt,
      serviceName: services.name,
      staffName: staff.name,
      businessName: businesses.name,
      businessSlug: businesses.slug,
      businessPlan: businesses.plan,
      businessLanguage: businesses.language,
      businessEmail: businesses.email,
      businessPhone: businesses.phone,
      paypalClientId: businesses.paypalClientId,
      paypalClientSecret: businesses.paypalClientSecret,
      paymentId: payments.id,
      paymentStatus: payments.status,
      providerOrderId: payments.providerOrderId,
      amountLkr: payments.amountLkr,
    })
    .from(bookings)
    .innerJoin(businesses, eq(businesses.id, bookings.businessId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .innerJoin(staff, eq(staff.id, bookings.staffId))
    .innerJoin(payments, eq(payments.bookingId, bookings.id))
    .where(and(eq(bookings.id, input.bookingId), eq(payments.provider, "paypal")))
    .limit(1);

  if (!row) {
    return { ok: false, error: "Booking not found.", status: 404 };
  }

  if (row.providerOrderId && row.providerOrderId !== input.orderId) {
    return { ok: false, error: "PayPal order mismatch.", status: 400 };
  }

  if (row.paymentStatus === "success") {
    return { ok: true, duplicate: true };
  }

  const clientSecret = decryptSecret(row.paypalClientSecret);
  if (!row.paypalClientId || !clientSecret) {
    return { ok: false, error: "PayPal credentials incomplete.", status: 400 };
  }

  const capture = await capturePaypalOrder({
    clientId: row.paypalClientId,
    clientSecret,
    orderId: input.orderId,
  });

  if (capture.status !== "COMPLETED") {
    await db
      .update(payments)
      .set({ status: "failed", providerPayload: capture.payload })
      .where(and(eq(payments.id, row.paymentId), eq(payments.status, "pending")));

    return { ok: false, error: "PayPal payment was not completed.", status: 400 };
  }

  const [claimedPayment] = await db
    .update(payments)
    .set({
      status: "success",
      providerOrderId: input.orderId,
      providerPayload: capture.payload,
    })
    .where(and(eq(payments.id, row.paymentId), eq(payments.status, "pending")))
    .returning({ id: payments.id });

  if (!claimedPayment) {
    return { ok: true, duplicate: true };
  }

  const [confirmedBooking] = await db
    .update(bookings)
    .set({ status: "confirmed" })
    .where(and(eq(bookings.id, row.bookingId), eq(bookings.status, "pending")))
    .returning({ id: bookings.id });

  if (!confirmedBooking) {
    return { ok: true, duplicate: true };
  }

  void processBookingAutomationTrigger(row.businessId, row.bookingId, "booking.confirmed").catch((error) => {
    console.error("Automation trigger failed:", error);
  });

  await logActivity({
    action: "payment_success",
    businessId: row.businessId,
    entity: "booking",
    entityId: row.bookingId,
    meta: { provider: "paypal", orderId: input.orderId },
  });

  runAfterResponse("PayPal booking notifications", async () => {
    const manageUrl = buildClientBookingUrl({
      bookingId: row.bookingId,
      clientPhone: row.clientPhone,
    });
    const results = await Promise.allSettled([
      sendBookingConfirmationMessage({
        businessId: row.businessId,
        bookingId: row.bookingId,
        clientName: row.clientName,
        clientEmail: row.clientEmail,
        clientPhone: row.clientPhone,
        businessName: row.businessName,
        serviceName: row.serviceName,
        staffName: row.staffName,
        startsAt: row.startsAt,
        manageUrl,
        plan: row.businessPlan as Plan,
        language: row.businessLanguage as BookingLanguage,
      }),
      row.clientEmail
        ? sendPaymentReceiptEmail({
            clientName: row.clientName,
            clientEmail: row.clientEmail,
            businessName: row.businessName,
            serviceName: row.serviceName,
            staffName: row.staffName,
            startsAt: row.startsAt,
            amountLkr: row.amountLkr,
            orderId: input.orderId,
            paymentId: row.paymentId,
            manageUrl,
          }).then(async (result) => {
            if (result.status === "sent") {
              await db
                .update(payments)
                .set({ receiptSentAt: new Date() })
                .where(eq(payments.id, row.paymentId));
            }
          })
        : Promise.resolve(),
      row.businessEmail
        ? sendBookingNotificationToBusiness({
            clientName: row.clientName,
            clientEmail: row.businessEmail,
            businessName: row.businessName,
            businessSlug: row.businessSlug,
            serviceName: row.serviceName,
            staffName: row.staffName,
            startsAt: row.startsAt,
            bookingId: row.bookingId,
          })
        : Promise.resolve(),
      row.businessPhone
        ? sendBookingNotificationToBusinessMessage({
            businessId: row.businessId,
            bookingId: row.bookingId,
            businessPhone: row.businessPhone,
            businessName: row.businessName,
            clientName: row.clientName,
            serviceName: row.serviceName,
            staffName: row.staffName,
            startsAt: row.startsAt,
            plan: row.businessPlan as Plan,
          })
        : Promise.resolve(),
    ]);
    logRejectedSettled("PayPal booking notifications", results);
  });

  return { ok: true };
}
