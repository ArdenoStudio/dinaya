import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, businesses, payments, services } from "@/db/schema";
import { eq } from "drizzle-orm";
import { buildPayhereFormData, getPayhereUrl } from "@/lib/payhere";
import { parseRequiredBusinessSlug } from "@/lib/booking/public-booking-access";
import { decryptSecret } from "@/lib/secrets";
import { withRateLimit } from "@/lib/rate-limit";

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
  const slug = parseRequiredBusinessSlug(req.nextUrl.searchParams.get("slug"));
  if (!slug) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

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
      serviceName: services.name,
      depositPercent: services.depositPercent,
      paymentId: payments.id,
      paymentStatus: payments.status,
      payhereOrderId: payments.payhereOrderId,
      amountLkr: payments.amountLkr,
    })
    .from(bookings)
    .innerJoin(businesses, eq(businesses.id, bookings.businessId))
    .innerJoin(services, eq(services.id, bookings.serviceId))
    .leftJoin(payments, eq(payments.bookingId, bookings.id))
    .where(eq(bookings.id, bookingId))
    .limit(1);

  if (!row || row.businessSlug !== slug) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  if (row.bookingStatus !== "pending" || row.paymentStatus !== "pending") {
    return NextResponse.json({ error: "Payment not required" }, { status: 400 });
  }

  if (!row.payhereEnabled || !row.payhereMerchantId || !row.payhereOrderId || !row.amountLkr) {
    return NextResponse.json({ error: "PayHere checkout unavailable" }, { status: 400 });
  }

  const merchantSecret = decryptSecret(row.payhereMerchantSecret);
  if (!merchantSecret) {
    return NextResponse.json({ error: "PayHere credentials incomplete" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const nameParts = row.clientName.split(" ");
  const depositLabel = row.depositPercent > 0 ? `${row.depositPercent}% deposit for ` : "";

  const formData = buildPayhereFormData({
    orderId: row.payhereOrderId,
    amountLkr: row.amountLkr,
    itemName: `${depositLabel}${row.serviceName} - ${row.businessName}`,
    firstName: nameParts[0] ?? row.clientName,
    lastName: nameParts.slice(1).join(" "),
    email: row.clientEmail || undefined,
    phone: row.clientPhone,
    notifyUrl: `${appUrl}/api/webhooks/payhere`,
    returnUrl: `${appUrl}/book/${row.businessSlug}/confirmed?bookingId=${row.bookingId}`,
    cancelUrl: `${appUrl}/book/${row.businessSlug}`,
    merchantId: row.payhereMerchantId,
    merchantSecret,
  });

  return NextResponse.json({
    payhereFormData: formData,
    payhereUrl: getPayhereUrl(),
  });
}
