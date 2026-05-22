import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, bookings, businesses, services, staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPayhereWebhook } from "@/lib/payhere";
import { parsePayhereWebhookFields } from "@/lib/payhere-webhook";
import { sendBookingNotificationToBusiness } from "@/lib/resend";
import { sendBookingConfirmationMessage } from "@/lib/messaging/booking-messages";
import { buildClientBookingUrl } from "@/lib/client-tokens";
import type { Plan } from "@/lib/plan";
import type { BookingLanguage } from "@/lib/i18n";
import { logActivity } from "@/lib/activity-log";
import { decryptSecret } from "@/lib/secrets";
import { processBookingAutomationTrigger } from "@/lib/automations/engine";
import { sendPaymentReceiptEmail } from "@/lib/receipts";
import { captureMessage } from "@/lib/monitoring";
import { trackPlatformEvent } from "@/lib/platform-events";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const fields = parsePayhereWebhookFields(form);

  if (!fields) {
    await captureMessage("PayHere webhook missing fields", { component: "payhere-webhook" });
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const { merchantId, orderId, payhereAmount, payhereCurrency, statusCode, md5sig } = fields;

  // Look up payment to get the merchant secret
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.payhereOrderId, orderId))
    .limit(1);

  if (!payment) {
    await captureMessage("PayHere webhook order not found", {
      component: "payhere-webhook",
      extra: { orderId },
    });
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const [booking] = await db
    .select({
      id: bookings.id,
      businessId: bookings.businessId,
      clientEmail: bookings.clientEmail,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      serviceId: bookings.serviceId,
      staffId: bookings.staffId,
      startsAt: bookings.startsAt,
    })
    .from(bookings)
    .where(eq(bookings.id, payment.bookingId))
    .limit(1);

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const [business] = await db
    .select({
      email: businesses.email,
      name: businesses.name,
      payhereMerchantSecret: businesses.payhereMerchantSecret,
      slug: businesses.slug,
      plan: businesses.plan,
      language: businesses.language,
    })
    .from(businesses)
    .where(eq(businesses.id, booking.businessId))
    .limit(1);

  if (!business) {
    return NextResponse.json({ error: "Business not found" }, { status: 404 });
  }

  const merchantSecret = decryptSecret(business.payhereMerchantSecret);
  if (!merchantSecret) {
    return NextResponse.json({ error: "Payment secret is not configured" }, { status: 400 });
  }

  const valid = verifyPayhereWebhook({
    merchantId,
    orderId,
    payhereAmount,
    payhereCurrency,
    statusCode,
    md5sig,
    merchantSecret,
  });

  if (!valid) {
    await captureMessage("PayHere webhook invalid signature", {
      businessId: booking.businessId,
      component: "payhere-webhook",
      extra: { orderId, statusCode },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const allFields: Record<string, string> = {};
  form.forEach((v, k) => { allFields[k] = v as string; });

  if (statusCode === "2") {
    if (payment.status === "success") {
      return NextResponse.json({ received: true, duplicate: true });
    }

    // Payment success
    await db
      .update(payments)
      .set({ status: "success", payherePayload: allFields })
      .where(eq(payments.id, payment.id));

    await db
      .update(bookings)
      .set({ status: "confirmed" })
      .where(eq(bookings.id, booking.id));

    void processBookingAutomationTrigger(booking.businessId, booking.id, "booking.confirmed").catch((error) => {
      console.error("Automation trigger failed:", error);
    });

    await logActivity({
      action: "payment_success",
      businessId: booking.businessId,
      entity: "booking",
      entityId: booking.id,
      meta: { orderId, amount: payhereAmount, currency: payhereCurrency },
    });
    void trackPlatformEvent({
      businessId: booking.businessId,
      event: "booking.payment_success",
      props: {
        amount: payhereAmount,
        bookingId: booking.id,
        currency: payhereCurrency,
        orderId,
      },
    });

    // Send confirmation emails
    const [service] = await db
      .select({ name: services.name })
      .from(services)
      .where(eq(services.id, booking.serviceId))
      .limit(1);
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, booking.staffId)).limit(1);

    await Promise.allSettled([
      sendBookingConfirmationMessage({
        businessId: booking.businessId,
        bookingId: booking.id,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        businessName: business.name,
        serviceName: service?.name ?? "Service",
        staffName: staffMember?.name ?? "Staff",
        startsAt: booking.startsAt,
        manageUrl: buildClientBookingUrl({
          bookingId: booking.id,
          clientPhone: booking.clientPhone,
        }),
        plan: business.plan as Plan,
        language: business.language as BookingLanguage,
      }),
      booking.clientEmail
        ? sendPaymentReceiptEmail({
            clientName: booking.clientName,
            clientEmail: booking.clientEmail,
            businessName: business.name,
            serviceName: service?.name ?? "Service",
            staffName: staffMember?.name ?? "Staff",
            startsAt: booking.startsAt,
            amountLkr: payment.amountLkr,
            orderId,
            paymentId: payment.id,
            manageUrl: buildClientBookingUrl({
              bookingId: booking.id,
              clientPhone: booking.clientPhone,
            }),
          }).then(async (result) => {
            if (result.status === "sent") {
              await db
                .update(payments)
                .set({ receiptSentAt: new Date() })
                .where(eq(payments.id, payment.id));
            }
          })
        : Promise.resolve(),
      business.email
        ? sendBookingNotificationToBusiness({
            clientName: booking.clientName,
            clientEmail: business.email,
            businessName: business.name,
            businessSlug: business.slug,
            serviceName: service?.name ?? "Service",
            staffName: staffMember?.name ?? "Staff",
            startsAt: booking.startsAt,
            bookingId: booking.id,
          })
        : Promise.resolve(),
    ]);
  } else if (statusCode === "-1" || statusCode === "-2" || statusCode === "-3") {
    await db
      .update(payments)
      .set({ status: "failed", payherePayload: allFields })
      .where(eq(payments.id, payment.id));
    void trackPlatformEvent({
      businessId: booking.businessId,
      event: "booking.payment_failed",
      props: {
        bookingId: booking.id,
        orderId,
        statusCode,
      },
    });
  }

  return NextResponse.json({ received: true });
}
