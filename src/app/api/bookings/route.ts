import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { bookings, payments, businesses, services, staff, clients, staffServices } from "@/db/schema";
import { eq, and, lt, gt, gte, inArray, count } from "drizzle-orm";
import { buildPayhereFormData, getPayhereUrl } from "@/lib/payhere";
import { sendBookingConfirmationToClient, sendBookingNotificationToBusiness } from "@/lib/resend";
import { generateOrderId } from "@/lib/utils";
import { dispatchWebhooks } from "@/lib/webhooks";
import { logActivity } from "@/lib/activity-log";
import { normalizeSriLankanPhone } from "@/lib/phone";
import { decryptSecret } from "@/lib/secrets";
import { PlanLimitError, requirePlanLimit, requirePro } from "@/lib/plan";
import { z } from "@/lib/validation";
import { startOfMonth } from "date-fns";

const bookingSchema = z.object({
  businessId: z.uuid(),
  serviceId: z.uuid(),
  staffId: z.uuid(),
  startsAt: z.iso.datetime(),
  endsAt: z.iso.datetime(),
  clientName: z.string().trim().min(1).max(100),
  clientPhone: z.string().trim().min(7).max(30),
  clientEmail: z.email().optional().nullable().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().nullable(),
  source: z.enum(["public", "manual", "api", "import"]).optional(),
});

function isOverlapConstraintError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const maybe = error as { code?: string; cause?: { code?: string } };
  return maybe.code === "23P01" || maybe.cause?.code === "23P01";
}

export async function POST(req: NextRequest) {
  const parsed = bookingSchema.safeParse(await req.json());

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please check the booking details.", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const {
    businessId,
    serviceId,
    staffId,
    startsAt,
    endsAt,
    clientName,
    clientEmail,
    notes,
    source: requestedSource = "public",
  } = parsed.data;
  const session = await auth();
  const source = session?.user?.businessId === businessId ? requestedSource : "public";

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const clientPhone = normalizeSriLankanPhone(parsed.data.clientPhone);

  if (!clientPhone) {
    return NextResponse.json({ error: "A valid phone number is required." }, { status: 400 });
  }

  if (end <= start) {
    return NextResponse.json({ error: "Booking end time must be after start time." }, { status: 400 });
  }

  const [business] = await db
    .select({
      id: businesses.id,
      email: businesses.email,
      name: businesses.name,
      bankTransferInstructions: businesses.bankTransferInstructions,
      lankaqrImageUrl: businesses.lankaqrImageUrl,
      payhereEnabled: businesses.payhereEnabled,
      payhereMerchantId: businesses.payhereMerchantId,
      payhereMerchantSecret: businesses.payhereMerchantSecret,
      slug: businesses.slug,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  const [{ value: monthBookingCount }] = await db
    .select({ value: count() })
    .from(bookings)
    .where(and(eq(bookings.businessId, businessId), gte(bookings.createdAt, startOfMonth(new Date()))));
  try {
    await requirePlanLimit(businessId, "bookingsPerMonth", Number(monthBookingCount));
  } catch (error) {
    if (error instanceof PlanLimitError) {
      return NextResponse.json({ error: "This business has reached the free plan limit of 50 bookings this month." }, { status: 402 });
    }
    throw error;
  }

  const [service] = await db
    .select({
      id: services.id,
      name: services.name,
      priceLkr: services.priceLkr,
      depositPercent: services.depositPercent,
      requiresPayment: services.requiresPayment,
      durationMinutes: services.durationMinutes,
      isActive: services.isActive,
    })
    .from(services)
    .where(and(eq(services.id, serviceId), eq(services.businessId, businessId)))
    .limit(1);

  if (!service || !service.isActive) {
    return NextResponse.json({ error: "Service is not available." }, { status: 400 });
  }

  const [staffMember] = await db
    .select({
      id: staff.id,
      name: staff.name,
      isActive: staff.isActive,
    })
    .from(staff)
    .where(and(eq(staff.id, staffId), eq(staff.businessId, businessId)))
    .limit(1);

  if (!staffMember || !staffMember.isActive) {
    return NextResponse.json({ error: "Staff member is not available." }, { status: 400 });
  }

  const [eligible] = await db
    .select({ staffId: staffServices.staffId })
    .from(staffServices)
    .where(and(eq(staffServices.staffId, staffId), eq(staffServices.serviceId, serviceId)))
    .limit(1);

  if (!eligible) {
    return NextResponse.json({ error: "This staff member cannot perform the selected service." }, { status: 400 });
  }

  const expectedEnd = new Date(start.getTime() + service.durationMinutes * 60_000);
  if (Math.abs(expectedEnd.getTime() - end.getTime()) > 60_000) {
    return NextResponse.json({ error: "Booking duration does not match the selected service." }, { status: 400 });
  }

  // Fast pre-check. The database exclusion constraint is the final race guard.
  const conflict = await db
    .select({ id: bookings.id })
    .from(bookings)
    .where(
      and(
        eq(bookings.staffId, staffId),
        inArray(bookings.status, ["pending", "confirmed"]),
        lt(bookings.startsAt, end),
        gt(bookings.endsAt, start)
      )
    )
    .limit(1);

  if (conflict.length > 0) {
    return NextResponse.json(
      { error: "This slot was just taken. Please pick another time." },
      { status: 409 }
    );
  }

  // Upsert client record — match by phone within this business
  const [client] = await db
    .insert(clients)
    .values({
      businessId,
      name: clientName,
      phone: clientPhone,
      email: clientEmail || null,
      stage: "active",
      source: source === "manual" ? "manual" : "booking_page",
    })
    .onConflictDoUpdate({
      target: [clients.businessId, clients.phone],
      set: {
        name: clientName,
        email: clientEmail || null,
        stage: "active",
      },
    })
    .returning({ id: clients.id });

  // Create booking (pending until payment/proof is confirmed, or immediately confirmed if free)
  const payhereEnabled = service.requiresPayment && service.priceLkr > 0 && business.payhereEnabled && business.payhereMerchantId;
  if (payhereEnabled) {
    try {
      await requirePro(businessId, "payments");
    } catch (error) {
      if (error instanceof PlanLimitError) throw error;
      return NextResponse.json({ error: "PayHere payments require Dinaya Pro." }, { status: 402 });
    }
  }
  const manualPaymentRequired = Boolean(
    service.requiresPayment &&
    service.priceLkr > 0 &&
    !payhereEnabled &&
    (business.bankTransferInstructions || business.lankaqrImageUrl)
  );
  const requiresPayherePayment = Boolean(payhereEnabled);
  const initialStatus = requiresPayherePayment || manualPaymentRequired ? "pending" : "confirmed";

  let booking: { id: string } | undefined;

  try {
    [booking] = await db
      .insert(bookings)
      .values({
        businessId,
        serviceId,
        staffId,
        clientId: client.id,
        clientName,
        clientPhone,
        clientEmail: clientEmail || null,
        startsAt: start,
        endsAt: end,
        status: initialStatus,
        source,
        notes: notes || null,
      })
      .returning({ id: bookings.id });
  } catch (error) {
    if (isOverlapConstraintError(error)) {
      return NextResponse.json(
        { error: "This slot was just taken. Please pick another time." },
        { status: 409 }
      );
    }
    throw error;
  }

  if (!booking) {
    return NextResponse.json({ error: "Could not create booking." }, { status: 500 });
  }

  void logActivity({
    action: "created",
    businessId,
    entity: "booking",
    entityId: booking.id,
    meta: { source, status: initialStatus },
  }).catch((error) => {
    console.error("Activity log write failed:", error);
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
    startsAt: start.toISOString(),
    endsAt: end.toISOString(),
  });

  // Send emails for confirmed bookings immediately. Manual payment bookings remain pending.
  if (!requiresPayherePayment) {
    await Promise.allSettled([
      initialStatus === "confirmed" && clientEmail
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

    return NextResponse.json({
      bookingId: booking.id,
      manualPayment: manualPaymentRequired,
      status: initialStatus,
    });
  }

  // ── PayHere payment flow ────────────────────────────────────────────────
  const orderId = generateOrderId();
  const amountDueLkr = service.depositPercent > 0
    ? Math.ceil((service.priceLkr * service.depositPercent) / 100)
    : service.priceLkr;

  await db.insert(payments).values({
    bookingId: booking.id,
    amountLkr: amountDueLkr,
    payhereOrderId: orderId,
    status: "pending",
  });

  const merchantSecret = decryptSecret(business.payhereMerchantSecret);
  if (!merchantSecret) {
    return NextResponse.json(
      { error: "PayHere is enabled but the merchant secret is missing." },
      { status: 400 }
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? req.nextUrl.origin;
  const nameParts = clientName.split(" ");

  const formData = buildPayhereFormData({
    orderId,
    amountLkr: amountDueLkr,
    itemName: `${service.depositPercent > 0 ? `${service.depositPercent}% deposit for ` : ""}${service.name} - ${business.name}`,
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" "),
    email: clientEmail || undefined,
    phone: clientPhone,
    notifyUrl: `${appUrl}/api/webhooks/payhere`,
    returnUrl: `${appUrl}/book/${business.slug}/confirmed?bookingId=${booking.id}`,
    cancelUrl: `${appUrl}/book/${business.slug}`,
    merchantId: business.payhereMerchantId!,
    merchantSecret,
  });

  return NextResponse.json({
    bookingId: booking.id,
    payhereFormData: formData,
    payhereUrl: getPayhereUrl(),
  });
}
