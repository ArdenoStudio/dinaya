import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { bookings, payments, businesses, services, staff, clients } from "@/db/schema";
import { eq, and, lt, gte } from "drizzle-orm";
import { buildPayhereFormData, getPayhereUrl } from "@/lib/payhere";
import { sendBookingConfirmationToClient, sendBookingNotificationToBusiness } from "@/lib/resend";
import { generateOrderId } from "@/lib/utils";
import { dispatchWebhooks } from "@/lib/webhooks";
import { logActivity } from "@/lib/activity-log";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    businessId,
    serviceId,
    staffId,
    startsAt,
    endsAt,
    clientName,
    clientPhone,
    clientEmail,
    notes,
    source,
  } = body;

  if (!businessId || !serviceId || !staffId || !startsAt || !endsAt || !clientName || !clientPhone) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  // Verify slot is still available (race condition guard)
  const conflict = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.staffId, staffId),
        lt(bookings.startsAt, new Date(endsAt)),
        gte(bookings.endsAt, new Date(startsAt))
      )
    )
    .limit(1);

  if (conflict.length > 0) {
    return NextResponse.json(
      { error: "This slot was just taken. Please pick another time." },
      { status: 409 }
    );
  }

  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  const [service] = await db
    .select()
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  const [staffMember] = await db
    .select()
    .from(staff)
    .where(eq(staff.id, staffId))
    .limit(1);

  // Upsert client record — match by phone within this business
  let clientId: string | null = null;
  const [existingClient] = await db
    .select({ id: clients.id })
    .from(clients)
    .where(and(eq(clients.businessId, businessId), eq(clients.phone, clientPhone)))
    .limit(1);

  if (existingClient) {
    clientId = existingClient.id;
    // Promote stage to "active" if not already
    await db
      .update(clients)
      .set({ stage: "active", name: clientName, email: clientEmail || undefined })
      .where(eq(clients.id, existingClient.id));
  } else {
    const [newClient] = await db
      .insert(clients)
      .values({
        businessId,
        name: clientName,
        phone: clientPhone,
        email: clientEmail || null,
        stage: "active",
        source: "booking_page",
      })
      .returning({ id: clients.id });
    clientId = newClient.id;
  }

  // Create booking (pending until payment confirmed, or immediately confirmed if free)
  const payhereEnabled = service.requiresPayment && business.payhereEnabled && business.payhereMerchantId;
  const requiresPayment = payhereEnabled;
  const initialStatus = requiresPayment ? "pending" : "confirmed";

  const [booking] = await db
    .insert(bookings)
    .values({
      businessId,
      serviceId,
      staffId,
      clientId,
      clientName,
      clientPhone,
      clientEmail: clientEmail || null,
      startsAt: new Date(startsAt),
      endsAt: new Date(endsAt),
      status: initialStatus,
      source: source ?? "public",
      notes: notes || null,
    })
    .returning({ id: bookings.id });

  await logActivity({
    action: "created",
    businessId,
    entity: "booking",
    entityId: booking.id,
    meta: { source: source ?? "public", status: initialStatus },
  });

  // Fire webhook for booking creation
  void dispatchWebhooks(businessId, "booking.created", {
    bookingId: booking.id,
    status: initialStatus,
    clientName,
    clientPhone,
    clientEmail: clientEmail || null,
    serviceName: service.name,
    staffName: staffMember.name,
    startsAt,
    endsAt,
  });

  // Send emails for free bookings immediately
  if (!requiresPayment) {
    await Promise.allSettled([
      clientEmail
        ? sendBookingConfirmationToClient({
            clientName,
            clientEmail,
            businessName: business.name,
            businessSlug: business.slug,
            serviceName: service.name,
            staffName: staffMember.name,
            startsAt: new Date(startsAt),
            bookingId: booking.id,
          })
        : Promise.resolve(),
      business.email
        ? sendBookingNotificationToBusiness({
            clientName,
            clientEmail: business.email,
            businessName: business.name,
            businessSlug: business.slug,
            serviceName: service.name,
            staffName: staffMember.name,
            startsAt: new Date(startsAt),
            bookingId: booking.id,
          })
        : Promise.resolve(),
    ]);

    return NextResponse.json({ bookingId: booking.id });
  }

  // ── PayHere payment flow ────────────────────────────────────────────────
  const orderId = generateOrderId();

  await db.insert(payments).values({
    bookingId: booking.id,
    amountLkr: service.priceLkr,
    payhereOrderId: orderId,
    status: "pending",
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const nameParts = clientName.split(" ");

  const formData = buildPayhereFormData({
    orderId,
    amountLkr: service.priceLkr,
    itemName: `${service.name} — ${business.name}`,
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" "),
    email: clientEmail,
    phone: clientPhone,
    notifyUrl: `${appUrl}/api/webhooks/payhere`,
    returnUrl: `${appUrl}/book/${business.slug}/confirmed?bookingId=${booking.id}`,
    cancelUrl: `${appUrl}/book/${business.slug}`,
    merchantId: business.payhereMerchantId!,
    merchantSecret: business.payhereMerchantSecret!,
  });

  return NextResponse.json({
    bookingId: booking.id,
    payhereFormData: formData,
    payhereUrl: getPayhereUrl(),
  });
}
