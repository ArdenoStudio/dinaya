import { db } from "@/db";
import { webhookDeliveries, webhooks } from "@/db/schema";
import { eq, and, lte, lt } from "drizzle-orm";
import crypto from "crypto";
import type { WebhookEvent, WebhookPayload } from "@/lib/webhooks";
import { postSafeWebhook } from "@/lib/webhook-http";
import { UNSAFE_WEBHOOK_DESTINATION_ERROR } from "@/lib/webhook-url";

function sign(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

const MAX_ATTEMPTS = 5;

async function currentAttempts(deliveryId?: string): Promise<number> {
  if (!deliveryId) return 0;
  const [row] = await db
    .select({ attempts: webhookDeliveries.attempts })
    .from(webhookDeliveries)
    .where(eq(webhookDeliveries.id, deliveryId))
    .limit(1);
  return row?.attempts ?? 0;
}

function nextRetryAt(attempts: number): Date | null {
  return attempts >= MAX_ATTEMPTS ? null : new Date(Date.now() + attempts * 15 * 60 * 1000);
}

async function deliverWebhook(
  hook: typeof webhooks.$inferSelect,
  event: WebhookEvent,
  payload: WebhookPayload,
  deliveryId?: string,
): Promise<void> {
  const body = JSON.stringify(payload);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "X-Dinaya-Event": event,
    "X-Dinaya-Timestamp": payload.createdAt,
  };
  if (hook.secret) {
    headers["X-Dinaya-Signature"] = `sha256=${sign(hook.secret, body)}`;
  }
  const previousAttempts = await currentAttempts(deliveryId);

  try {
    const response = await postSafeWebhook(hook.url, { headers, body });
    const responseBody = response.responseBody;
    const attempts = deliveryId ? previousAttempts + 1 : 1;
    if (deliveryId) {
      await db
        .update(webhookDeliveries)
        .set({
          status: response.ok ? "success" : "failed",
          statusCode: response.status,
          responseBody,
          attempts,
          nextAttemptAt: response.ok ? null : nextRetryAt(attempts),
          error: response.ok ? null : `HTTP ${response.status}`,
        })
        .where(eq(webhookDeliveries.id, deliveryId));
      return;
    }
    await db.insert(webhookDeliveries).values({
      webhookId: hook.id,
      event,
      entityId: typeof payload.data.bookingId === "string" ? payload.data.bookingId : null,
      requestBody: payload,
      status: response.ok ? "success" : "failed",
      statusCode: response.status,
      responseBody,
      attempts: 1,
      nextAttemptAt: response.ok
        ? null
        : new Date(Date.now() + 15 * 60 * 1000),
      error: response.ok ? null : `HTTP ${response.status}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook delivery failed";
    const attempts = message === UNSAFE_WEBHOOK_DESTINATION_ERROR
      ? MAX_ATTEMPTS
      : deliveryId
      ? previousAttempts + 1
      : 1;
    if (deliveryId) {
      await db
        .update(webhookDeliveries)
        .set({
          status: "failed",
          attempts,
          nextAttemptAt: nextRetryAt(attempts),
          error: message,
        })
        .where(eq(webhookDeliveries.id, deliveryId));
      return;
    }
    await db.insert(webhookDeliveries).values({
      webhookId: hook.id,
      event,
      entityId: typeof payload.data.bookingId === "string" ? payload.data.bookingId : null,
      requestBody: payload,
      status: "failed",
      attempts: 1,
      nextAttemptAt:
        message === UNSAFE_WEBHOOK_DESTINATION_ERROR ? null : new Date(Date.now() + 15 * 60 * 1000),
      error: message,
    });
  }
}

export async function retryDueWebhookDeliveries(limit = 20): Promise<number> {
  const due = await db
    .select({
      delivery: webhookDeliveries,
      hook: webhooks,
    })
    .from(webhookDeliveries)
    .innerJoin(webhooks, eq(webhookDeliveries.webhookId, webhooks.id))
    .where(
      and(
        eq(webhookDeliveries.status, "failed"),
        lt(webhookDeliveries.attempts, MAX_ATTEMPTS),
        lte(webhookDeliveries.nextAttemptAt, new Date()),
      ),
    )
    .limit(limit);

  let retried = 0;
  for (const row of due) {
    const payload = row.delivery.requestBody as WebhookPayload | null;
    if (!payload) continue;
    await deliverWebhook(row.hook, row.delivery.event as WebhookEvent, payload, row.delivery.id);
    retried++;
  }
  return retried;
}

export async function replayWebhookDeliveryById(deliveryId: string): Promise<void> {
  const [row] = await db
    .select({
      delivery: webhookDeliveries,
      hook: webhooks,
    })
    .from(webhookDeliveries)
    .innerJoin(webhooks, eq(webhookDeliveries.webhookId, webhooks.id))
    .where(eq(webhookDeliveries.id, deliveryId))
    .limit(1);

  if (!row) {
    throw new Error("Webhook delivery not found.");
  }

  const payload = row.delivery.requestBody as WebhookPayload | null;
  if (!payload) {
    throw new Error("Delivery payload missing.");
  }

  await deliverWebhook(row.hook, row.delivery.event as WebhookEvent, payload, row.delivery.id);
}
