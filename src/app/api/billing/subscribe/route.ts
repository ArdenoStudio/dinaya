import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, subscriptions, users } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { buildRecurringFormData, PAYHERE_CHECKOUT_URL } from "@/lib/payhere-subscriptions";
import { parseSubscribeRequest } from "@/lib/billing-subscribe";
import { generateOrderId } from "@/lib/utils";
import { requireApiBusiness } from "@/lib/api-auth";
import {
  getPlanConfigAsync,
  getSubscriptionPrice,
  isPaidPlanAvailable,
  payhereRecurrence,
  planRank,
  subscriptionItemName,
  type BillingInterval,
  type Plan,
  type PaidPlan,
} from "@/lib/plan";

export async function POST(req: NextRequest) {
  const authResult = await requireApiBusiness({ ownerOnly: true, req });
  if (!authResult.ok) return authResult.response;
  const { businessId, user } = authResult.context;

  let targetPlan: PaidPlan = "pro";
  let interval: BillingInterval = "monthly";
  try {
    const body = (await req.json()) as { plan?: string; interval?: string };
    ({ targetPlan, interval } = parseSubscribeRequest(body));
  } catch {
    // default to monthly pro when no JSON body
  }

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

  const currentPlan = (business.plan ?? "expired") as Plan;
  if (planRank(currentPlan) >= planRank(targetPlan)) {
    return NextResponse.json(
      { error: `Already on ${targetPlan === "max" ? "Max" : "Pro"} or a higher plan.` },
      { status: 409 }
    );
  }

  const [existingActive] = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(and(
      eq(subscriptions.businessId, businessId),
      inArray(subscriptions.status, ["pending", "active", "past_due"]),
    ))
    .limit(1);

  if (existingActive) {
    return NextResponse.json(
      { error: "A subscription is already in progress for this business." },
      { status: 409 },
    );
  }

  const config = await getPlanConfigAsync();
  if (!isPaidPlanAvailable(targetPlan, config)) {
    return NextResponse.json(
      { error: `${targetPlan === "max" ? "Max" : "Pro"} is not available for purchase yet.` },
      { status: 403 },
    );
  }

  const [owner] = await db
    .select({ name: users.name, email: users.email })
    .from(users)
    .where(eq(users.id, user.id))
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
  const amountLkr = getSubscriptionPrice(targetPlan, interval);

  await db.insert(subscriptions).values({
    businessId,
    payhereOrderId: orderId,
    plan: targetPlan,
    billingInterval: interval,
    amountLkr,
    status: "pending",
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const formData = buildRecurringFormData({
    orderId,
    amountLkr,
    itemName: subscriptionItemName(targetPlan, interval),
    firstName: nameParts[0],
    lastName: nameParts.slice(1).join(" "),
    email: contactEmail,
    phone: contactPhone,
    notifyUrl: `${appUrl}/api/webhooks/payhere-subscription`,
    returnUrl: `${appUrl}/dashboard/billing?success=1`,
    cancelUrl: `${appUrl}/dashboard/billing?cancelled=1`,
    recurrence: payhereRecurrence(interval),
    duration: "Forever",
  });

  return NextResponse.json({
    checkoutUrl: PAYHERE_CHECKOUT_URL,
    formData,
  });
}
