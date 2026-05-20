import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/db";
import { businesses, subscriptions, users } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { buildRecurringFormData, PAYHERE_CHECKOUT_URL } from "@/lib/payhere-subscriptions";
import { generateOrderId } from "@/lib/utils";

const PRO_PRICE_LKR = Number(process.env.DINAYA_PRO_MONTHLY_PRICE_LKR ?? "2500");

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const businessId = (session.user as { businessId: string }).businessId;
  const userId = (session.user as { id: string }).id;

  const [business] = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      email: businesses.email,
      phone: businesses.phone,
      plan: businesses.plan,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!business) {
    return NextResponse.json({ error: "Business not found." }, { status: 404 });
  }

  if (business.plan === "pro") {
    return NextResponse.json({ error: "Already on the Pro plan." }, { status: 409 });
  }

  // Block double-subscribing if there's already an active subscription pending PayHere confirmation
  const [existingActive] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(
      eq(subscriptions.businessId, businessId),
      inArray(subscriptions.status, ["active", "past_due"]),
    ))
    .limit(1);

  if (existingActive) {
    return NextResponse.json(
      { error: "A subscription is already in progress for this business." },
      { status: 409 },
    );
  }

  // Get the owner's name + email for the PayHere checkout (required fields)
  const [owner] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const contactEmail = business.email ?? owner?.email ?? "";
  const contactPhone = business.phone ?? "";
  if (!contactEmail || !contactPhone) {
    return NextResponse.json(
      { error: "Add a business email and phone in Settings before upgrading." },
      { status: 400 },
    );
  }

  const orderId = generateOrderId();
  const nameParts = (owner?.name ?? business.name).split(" ");

  // Record the pending subscription before redirecting so the webhook can find it
  await db.insert(subscriptions).values({
    businessId,
    payhereOrderId: orderId,
    amountLkr: PRO_PRICE_LKR,
    status: "active",
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const formData = buildRecurringFormData({
    orderId,
    amountLkr: PRO_PRICE_LKR,
    itemName: "Dinaya Pro — monthly subscription",
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" "),
    email: contactEmail,
    phone: contactPhone,
    notifyUrl: `${appUrl}/api/webhooks/payhere-subscription`,
    returnUrl: `${appUrl}/dashboard/billing?success=1`,
    cancelUrl: `${appUrl}/dashboard/billing?cancelled=1`,
    recurrence: "1 Month",
    duration: "Forever",
  });

  return NextResponse.json({
    checkoutUrl: PAYHERE_CHECKOUT_URL,
    formData,
  });
}
