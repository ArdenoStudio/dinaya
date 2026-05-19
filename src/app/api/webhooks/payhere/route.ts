import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, bookings, businesses, services, staff } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyPayhereWebhook } from "@/lib/payhere";
import { sendBookingConfirmationToClient, sendBookingNotificationToBusiness } from "@/lib/resend";
import { logActivity } from "@/lib/activity-log";
import { decryptSecret } from "@/lib/secrets";

export async function POST(req: NextRequest) {
  const form = await req.formData();

  const merchantId = form.get("merchant_id") as string;
  const orderId = form.get("order_id") as string;
  const payhereAmount = form.get("payhere_amount") as string;
  const payhereCurrency = form.get("payhere_currency") as string;
  const statusCode = form.get("status_code") as string;
  const md5sig = form.get("md5sig") as string;

  if (!merchantId || !orderId || !payhereAmount || !payhereCurrency || !statusCode || !md5sig) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  // Look up payment to get the merchant secret
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.payhereOrderId, orderId))
    .limit(1);

  if (!payment) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const [booking] = await db
    .select({
      id: bookings.id,
      businessId: bookings.businessId,
      clientEmail: bookings.clientEmail,
      clientName: bookings.clientName,
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

    await logActivity({
      action: "payment_success",
      businessId: booking.businessId,
      entity: "booking",
      entityId: booking.id,
      meta: { orderId, amount: payhereAmount, currency: payhereCurrency },
    });

    // Send confirmation emails
    const [service] = await db
      .select({ name: services.name })
      .from(services)
      .where(eq(services.id, booking.serviceId))
      .limit(1);
    const [staffMember] = await db.select().from(staff).where(eq(staff.id, booking.staffId)).limit(1);

    await Promise.allSettled([
      booking.clientEmail
        ? sendBookingConfirmationToClient({
            clientName: booking.clientName,
            clientEmail: booking.clientEmail,
            businessName: business.name,
            businessSlug: business.slug,
            serviceName: service.name,
            staffName: staffMember.name,
            startsAt: booking.startsAt,
            bookingId: booking.id,
          })
        : Promise.resolve(),
      business.email
        ? sendBookingNotificationToBusiness({
            clientName: booking.clientName,
            clientEmail: business.email,
            businessName: business.name,
            businessSlug: business.slug,
            serviceName: service.name,
            staffName: staffMember.name,
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
  }

  return NextResponse.json({ received: true });
}
