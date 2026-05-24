import { db } from "@/db";
import { bookingNotifications } from "@/db/schema";
import { and, eq } from "drizzle-orm";
import type { BookingNotificationType, MessageChannel, ProviderSendResult } from "@/lib/messaging/types";

export async function hasBookingNotification(
  bookingId: string,
  type: BookingNotificationType,
  channel: MessageChannel,
): Promise<boolean> {
  const [existing] = await db
    .select({ id: bookingNotifications.id })
    .from(bookingNotifications)
    .where(and(
      eq(bookingNotifications.bookingId, bookingId),
      eq(bookingNotifications.type, type),
      eq(bookingNotifications.channel, channel),
    ))
    .limit(1);

  return Boolean(existing);
}

export async function logBookingNotification(input: {
  bookingId: string;
  type: BookingNotificationType;
  channel: MessageChannel | "none";
  result: ProviderSendResult;
}): Promise<void> {
  if (input.channel === "none") return;

  await db
    .insert(bookingNotifications)
    .values({
      bookingId: input.bookingId,
      type: input.type,
      channel: input.channel,
      status: input.result.status,
      provider: input.result.provider,
      providerMessageId: input.result.providerMessageId ?? null,
      error: input.result.error ?? null,
      sentAt: input.result.status === "sent" ? new Date() : null,
    })
    .onConflictDoNothing();
}
