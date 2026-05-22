import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { subscriptions, businesses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyRecurringWebhook } from "@/lib/payhere-subscriptions";
import { addMonths, addYears } from "date-fns";
import { captureMessage } from "@/lib/monitoring";
import { trackPlatformEvent } from "@/lib/platform-events";

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
    await captureMessage("PayHere subscription webhook missing fields", {
      component: "payhere-subscription-webhook",
    });
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const merchantSecret = process.env.DINAYA_PAYHERE_MERCHANT_SECRET;
  if (!merchantSecret) {
    await captureMessage("PayHere subscription merchant secret missing", {
      component: "payhere-subscription-webhook",
    });
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
    await captureMessage("PayHere subscription webhook invalid signature", {
      component: "payhere-subscription-webhook",
      extra: { orderId, statusCode },
    });
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const [sub] = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.payhereOrderId, orderId))
    .limit(1);

  if (!sub) {
    await captureMessage("PayHere subscription webhook order not found", {
      component: "payhere-subscription-webhook",
      extra: { orderId },
    });
    return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
  }

  // Apply status update
  switch (statusCode) {
    case "2": {
      const periodEnd =
        sub.billingInterval === "annual"
          ? addYears(new Date(), 1)
          : addMonths(new Date(), 1);
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
      void trackPlatformEvent({
        businessId: sub.businessId,
        event: "subscription.activated",
        props: {
          amount: payhereAmount,
          currency: payhereCurrency,
          interval: sub.billingInterval,
          orderId,
          plan: sub.plan,
        },
      });
      break;
    }
    case "-1": {
      await db
        .update(subscriptions)
        .set({ status: "cancelled", cancelledAt: new Date() })
        .where(eq(subscriptions.id, sub.id));

      if (sub.status === "pending") {
        break;
      }
      void trackPlatformEvent({
        businessId: sub.businessId,
        event: "subscription.cancelled",
        props: { orderId, plan: sub.plan },
      });
      break;
    }
    case "-2": {
      await db
        .update(subscriptions)
        .set({ status: "past_due" })
        .where(eq(subscriptions.id, sub.id));
      void trackPlatformEvent({
        businessId: sub.businessId,
        event: "subscription.past_due",
        props: { orderId, plan: sub.plan },
      });
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
      void trackPlatformEvent({
        businessId: sub.businessId,
        event: "subscription.ended",
        props: { orderId, plan: sub.plan, statusCode },
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}
