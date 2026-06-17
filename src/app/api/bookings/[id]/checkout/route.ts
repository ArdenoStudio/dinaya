import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, businesses, payments, services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { decryptSecret } from "@/lib/secrets";
import { withRateLimit } from "@/lib/rate-limit";
import { createPayhereCheckout } from "@/lib/payments/providers/payhere";
import { createPaypalCheckout, getPaypalOrder } from "@/lib/payments/providers/paypal";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const limited = await withRateLimit(req, {
    scope: "bookings",
    limit: 30,
    windowSeconds: 60,
  });
  if (!limited.ok) return limited.response;

  const { id: bookingId } = await context.params;
  const slug = req.nextUrl.searchParams.get("slug");

  const [row] = await db
    .select({
      bookingId: bookings.id,
      bookingStatus: bookings.status,
      clientName: bookings.clientName,
      clientPhone: bookings.clientPhone,
      clientEmail: bookings.clientEmail,
      businessSlug: businesses.slug,
      businessName: businesses.name,
      payhereEnabled: businesses.payhereEnabled,
      payhereMerchantId: businesses.payhereMerchantId,
      payhereMerchantSecret: businesses.payhereMerchantSecret,
      paypalEnabled: businesses.paypalEnabled,
      paypalClientId: businesses.paypalClientId,
      paypalClientSecret: businesses.paypalClientSecret,
      serviceName: services.name,
      depositPercent: services.depositPercent,
      paymentId: payments.id,
      paymentStatus: payments.status,
      paymentProvider: payments.provider,
      payhereOrderId: payments.payhereOrderId,
      providerOrderId: payments.providerOrderId,
      amountLkr: payments.amountLkr,
    })
    .from(bookings)
    .innerJoin(businesses, eq(businesses.id, bookings.businessId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(payments, eq(payments.bookingId, bookings.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row || (slug && row.businessSlug !== slug)) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (row.bookingStatus !== "pending" || row.paymentStatus !== "pending" || !row.paymentId) {
    return NextResponse.json({ error: "Payment not required" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const checkoutContext = {
    bookingId: row.bookingId,
    businessId: "",
    businessName: row.businessName,
    businessSlug: row.businessSlug,
    serviceName: row.serviceName,
    depositPercent: row.depositPercent,
    clientName: row.clientName,
    clientPhone: row.clientPhone,
    clientEmail: row.clientEmail,
    amountLkr: row.amountLkr ?? 0,
    appUrl,
  };

  if (row.paymentProvider === "paypal") {
    const clientSecret = decryptSecret(row.paypalClientSecret);
    if (!row.paypalEnabled || !row.paypalClientId || !clientSecret) {
      return NextResponse.json({ error: "PayPal checkout unavailable" }, { status: 400 });
    }

    if (row.providerOrderId) {
      const existing = await getPaypalOrder({
        clientId: row.paypalClientId,
        clientSecret,
        orderId: row.providerOrderId,
      });

      if (existing.approvalUrl && (existing.status === "CREATED" || existing.status === "APPROVED")) {
        return NextResponse.json({
          provider: "paypal",
          approvalUrl: existing.approvalUrl,
        });
      }
    }

    const paypal = await createPaypalCheckout({
      ...checkoutContext,
      paymentId: row.paymentId,
      clientId: row.paypalClientId,
      clientSecret,
    });

    return NextResponse.json({
      provider: "paypal",
      approvalUrl: paypal.approvalUrl,
    });
  }

  const merchantSecret = decryptSecret(row.payhereMerchantSecret);
  if (!row.payhereEnabled || !row.payhereMerchantId || !row.payhereOrderId || !row.amountLkr || !merchantSecret) {
    return NextResponse.json({ error: "PayHere checkout unavailable" }, { status: 400 });
  }

  const checkout = createPayhereCheckout({
    ...checkoutContext,
    merchantId: row.payhereMerchantId,
    merchantSecret,
    orderId: row.payhereOrderId,
  });

  return NextResponse.json({
    provider: "payhere",
    payhereFormData: checkout.payhereFormData,
    payhereUrl: checkout.payhereUrl,
  });
}
