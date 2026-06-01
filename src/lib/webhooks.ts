import { db } from "@/db";
import { webhookDeliveries, webhooks } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";
import { postSafeWebhook } from "@/lib/webhook-http";
import { UNSAFE_WEBHOOK_DESTINATION_ERROR } from "@/lib/webhook-url";

export type WebhookEvent =
  | "booking.created"
  | "booking.confirmed"
  | "booking.rescheduled"
  | "booking.cancelled"
  | "booking.completed"
  | "booking.no_show";

export interface WebhookPayload {
  event: WebhookEvent;
  createdAt: string;
  data: Record<string, unknown>;
}

function sign(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

const WEBHOOK_DELIVERY_CONCURRENCY = 5;

async function forEachWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  const executing = new Set<Promise<void>>();

  for (const item of items) {
    const promise = worker(item)
      .catch((error) => {
        console.error("[webhooks] delivery worker failed", error);
      })
      .finally(() => {
        executing.delete(promise);
      });
    executing.add(promise);

    if (executing.size >= limit) {
      await Promise.race(executing);
    }
  }

  await Promise.allSettled(executing);
}

export async function dispatchWebhooks(
  businessId: string,
  event: WebhookEvent,
  data: Record<string, unknown>
): Promise<void> {
  // Load active webhooks for this business that listen to this event
  const hooks = await db
    .select()
    .from(webhooks)
    .where(and(eq(webhooks.businessId, businessId), eq(webhooks.isActive, true)));

  const listeners = hooks.filter((h) => h.events.includes(event));
  if (listeners.length === 0) return;

  const payload: WebhookPayload = {
    event,
    createdAt: new Date().toISOString(),
    data,
  };
  const body = JSON.stringify(payload);

  await forEachWithConcurrency(
    listeners,
    WEBHOOK_DELIVERY_CONCURRENCY,
    async (hook) => {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        "X-Dinaya-Event": event,
        "X-Dinaya-Timestamp": payload.createdAt,
      };
      if (hook.secret) {
        headers["X-Dinaya-Signature"] = `sha256=${sign(hook.secret, body)}`;
      }
      const deliveryBase = {
        webhookId: hook.id,
        event,
        entityId: typeof data.bookingId === "string" ? data.bookingId : null,
        requestBody: payload,
      };

      try {
        const response = await postSafeWebhook(hook.url, { headers, body });
        await db.insert(webhookDeliveries).values({
          ...deliveryBase,
          status: response.ok ? "success" : "failed",
          statusCode: response.status,
          responseBody: response.responseBody,
          attempts: 1,
          nextAttemptAt: response.ok ? null : new Date(Date.now() + 15 * 60 * 1000),
          error: response.ok ? null : `HTTP ${response.status}`,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Webhook delivery failed";
        await db.insert(webhookDeliveries).values({
          ...deliveryBase,
          status: "failed",
          attempts: 1,
          nextAttemptAt:
            message === UNSAFE_WEBHOOK_DESTINATION_ERROR ? null : new Date(Date.now() + 15 * 60 * 1000),
          error: message,
        });
      }
    },
  );
}
