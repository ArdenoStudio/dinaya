import { NextResponse } from "next/server";
import { db } from "@/db";
import { businesses, subscriptions, users } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { buildRecurringFormData, PAYHERE_CHECKOUT_URL } from "@/lib/payhere-subscriptions";
import { generateOrderId } from "@/lib/utils";
import { requireApiBusiness } from "@/lib/api-auth";
import { getPlanConfig, planRank, type Plan } from "@/lib/plan";

function getPlanPrices() {
  const config = getPlanConfig();
  return {
    pro: config.proMonthlyPriceLkr,
    max: config.maxMonthlyPriceLkr,
  } satisfies Record<"pro" | "max", number>;
}

const PLAN_LABELS: Record<"pro" | "max", string> = {
  pro: "Dinaya Pro — monthly subscription",
  max: "Dinaya Max — monthly subscription",
};

export async function POST(req: Request) {
  const authResult = await requireApiBusiness({ ownerOnly: true });
  if (!authResult.ok) return authResult.response;
  const { businessId, user } = authResult.context;

  let targetPlan: "pro" | "max" = "pro";
  try {
    const body = (await req.json()) as { plan?: string };
    if (body.plan === "max" || body.plan === "pro") {
      targetPlan = body.plan;
    }
  } catch {
    // default to pro when no JSON body
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

  const currentPlan = (business.plan ?? "free") as Plan;
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
      inArray(subscriptions.status, ["active", "past_due"]),
    ))
    .limit(1);

  if (existingActive) {
    return NextResponse.json(
      { error: "A subscription is already in progress for this business." },
      { status: 409 },
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
  const amountLkr = getPlanPrices()[targetPlan];

  await db.insert(subscriptions).values({
    businessId,
    payhereOrderId: orderId,
    plan: targetPlan,
    amountLkr,
    status: "active",
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!;
  const formData = buildRecurringFormData({
    orderId,
    amountLkr,
    itemName: PLAN_LABELS[targetPlan],
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
