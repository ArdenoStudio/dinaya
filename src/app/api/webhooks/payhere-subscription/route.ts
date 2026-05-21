import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyRecurringWebhook } from "@/lib/payhere-subscriptions";
import { addMonths } from "date-fns";

// PayHere status codes:
//   2  = success (initial or renewal payment captured)
//   0  = pending
//  -1  = cancelled (by us via API, or by customer)
//  -2  = failed
//  -3  = chargedback

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const merchantId = String(form.get("merchant_id") ?? "");
  const orderId = String(form.get("order_id") ?? "");
  const payhereAmount = String(form.get("payhere_amount") ?? "");
  const payhereCurrency = String(form.get("payhere_currency") ?? "");
  const statusCode = String(form.get("status_code") ?? "");
  const md5sig = String(form.get("md5sig") ?? "");
  const subscriptionId = form.get("subscription_id")
    ? String(form.get("subscription_id"))
    : null;

  if (!merchantId || !orderId || !payhereAmount || !payhereCurrency || !statusCode || !md5sig) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const merchantSecret = process.env.DINAYA_PAYHERE_MERCHANT_SECRET;
  if (!merchantSecret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const valid = verifyRecurringWebhook({
    merchantId,
    orderId,
    payhereAmount,
    payhereCurrency,
    statusCode,
    md5sig,
    merchantSecret,
  });
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.payhereOrderId, orderId))
    .limit(1);

  if (!sub) {
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  // Apply status update
  switch (statusCode) {
    case "2": {
      // Payment captured — activate or renew Pro for one billing period
      const periodEnd = addMonths(new Date(), 1);
      await db
        .update(subscriptions)
        .set({
          status: "active",
          payhereSubscriptionId: subscriptionId ?? sub.payhereSubscriptionId,
          currentPeriodEnd: periodEnd,
        })
        .where(eq(subscriptions.id, sub.id));

      await db
        .update(businesses)
        .set({ plan: sub.plan, planExpiresAt: periodEnd })
        .where(eq(businesses.id, sub.businessId));
      break;
    }
    case "-1": {
      await db
        .update(subscriptions)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(eq(subscriptions.id, sub.id));
      // Plan stays "pro" until planExpiresAt; a separate sweep can downgrade.
      break;
    }
    case "-2": {
      await db
        .update(subscriptions)
        .set({ status: "past_due" })
        .where(eq(subscriptions.id, sub.id));
      break;
    }
    case "-3": {
      await db
        .update(subscriptions)
        .set({ status: "ended", cancelledAt: new Date() })
        .where(eq(subscriptions.id, sub.id));
      await db
        .update(businesses)
        .set({ plan: "free", planExpiresAt: null })
        .where(eq(businesses.id, sub.businessId));
      break;
    }
    default:
      // pending (0) or unknown — leave row untouched, return 200 so PayHere stops retrying
      break;
  }

  return NextResponse.json({ ok: true });
}
