import { db } from "@/db";
import { platformEvents } from "@/db/schema";

export type PlatformEventName =
  | "account.created"
  | "activation.first_booking"
  | "activation.step_completed"
  | "activation.nudge_sent"
  | "booking.created"
  | "booking.payment_pending"
  | "booking.payment_success"
  | "booking.payment_failed"
  | "billing.checkout_started"
  | "billing.checkout_created"
  | "billing.checkout_failed"
  | "directory.listing_changed"
  | "directory.booking_clicked"
  | "plan.limit_blocked"
  | "subscription.activated"
  | "subscription.cancelled"
  | "subscription.ended"
  | "subscription.past_due"
  | "system.error";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

type TrackPlatformEventInput = {
  businessId?: string | null;
  event: PlatformEventName;
  props?: Record<string, JsonValue | undefined>;
  sessionId?: string | null;
  userId?: string | null;
};

function compactProps(props: Record<string, JsonValue | undefined> | undefined): Record<string, JsonValue> {
  if (!props) return {};
  return Object.fromEntries(
    Object.entries(props).filter((entry): entry is [string, JsonValue] => entry[1] !== undefined),
  );
}

export async function trackPlatformEvent(input: TrackPlatformEventInput): Promise<void> {
  try {
    await db.insert(platformEvents).values({
      businessId: input.businessId ?? null,
      event: input.event,
      props: compactProps(input.props),
      sessionId: input.sessionId ?? null,
      userId: input.userId ?? null,
    });
  } catch (error) {
    console.error("[platform-event] write failed", error);
  }
}
