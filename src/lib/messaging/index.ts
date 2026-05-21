import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { communications } from "@/db/schema";
import { sendEmail, isEmailReady } from "@/lib/messaging/channels/email";
import { sendSms, isSmsReady } from "@/lib/messaging/channels/sms";
import { sendWhatsApp, isWhatsAppReady } from "@/lib/messaging/channels/whatsapp";
import { hasBookingNotification, logBookingNotification } from "@/lib/messaging/notification-log";
import type {
  MessageChannel,
  ProviderSendResult,
  SendMessageInput,
} from "@/lib/messaging/types";

function channelReady(channel: MessageChannel, input: SendMessageInput): boolean {
  if (channel === "email") return isEmailReady(input.clientEmail);
  if (channel === "whatsapp") return isWhatsAppReady(input.clientPhone);
  return isSmsReady(input.clientPhone);
}

function selectChannel(input: SendMessageInput): MessageChannel | null {
  const preferred = input.preferredChannels ?? ["email"];
  return preferred.find((channel) => channelReady(channel, input)) ?? null;
}

async function sendViaChannel(
  channel: MessageChannel,
  input: SendMessageInput,
): Promise<Omit<ProviderSendResult, "channel">> {
  if (channel === "email" && input.clientEmail) {
    const result = await sendEmail({
      clientEmail: input.clientEmail,
      subject: input.subject,
      body: input.body,
      html: typeof input.meta?.html === "string" ? input.meta.html : undefined,
    });
    return result;
  }

  if (channel === "whatsapp" && input.clientPhone) {
    return sendWhatsApp({ clientPhone: input.clientPhone, body: input.body });
  }

  if (channel === "sms" && input.clientPhone) {
    return sendSms({ clientPhone: input.clientPhone, body: input.body });
  }

  return {
    provider: channel,
    status: "skipped",
    error: "Recipient missing for selected channel.",
  };
}

async function logCommunication(input: SendMessageInput, result: ProviderSendResult): Promise<void> {
  await db.insert(communications).values({
    businessId: input.businessId,
    bookingId: input.bookingId ?? null,
    clientId: input.clientId ?? null,
    channel: result.channel,
    direction: "outbound",
    status: result.status,
    subject: input.subject,
    body: input.body,
    provider: result.provider,
    providerMessageId: result.providerMessageId ?? null,
    feature: input.feature,
    idempotencyKey: input.idempotencyKey,
    error: result.error ?? null,
    sentAt: result.status === "sent" ? new Date() : null,
    meta: input.meta ?? null,
  });
}

export async function sendMessage(input: SendMessageInput): Promise<ProviderSendResult> {
  if (input.bookingId && input.notificationType) {
    const channel = selectChannel(input);
    if (channel && await hasBookingNotification(input.bookingId, input.notificationType, channel)) {
      return { channel, provider: null, status: "duplicate" };
    }
  }

  const [existingComm] = await db
    .select({ id: communications.id })
    .from(communications)
    .where(and(
      eq(communications.businessId, input.businessId),
      eq(communications.idempotencyKey, input.idempotencyKey),
    ))
    .limit(1);

  if (existingComm) {
    return { channel: "none", provider: null, status: "duplicate" };
  }

  const channel = selectChannel(input);
  if (!channel) {
    const result: ProviderSendResult = {
      channel: "none",
      provider: null,
      status: "skipped",
      error: "No configured provider and recipient combination was available.",
    };
    await logCommunication(input, result);
    return result;
  }

  if (input.bookingId && input.notificationType) {
    if (await hasBookingNotification(input.bookingId, input.notificationType, channel)) {
      return { channel, provider: null, status: "duplicate" };
    }
  }

  try {
    const providerResult = await sendViaChannel(channel, input);
    const result: ProviderSendResult = { channel, ...providerResult };
    await logCommunication(input, result);

    if (input.bookingId && input.notificationType) {
      await logBookingNotification({
        bookingId: input.bookingId,
        type: input.notificationType,
        channel,
        result,
      });
    }

    return result;
  } catch (error) {
    const result: ProviderSendResult = {
      channel,
      provider: channel === "email" ? "resend" : channel === "whatsapp" ? "meta-whatsapp" : "sms-http",
      status: "failed",
      error: error instanceof Error ? error.message : "Provider send failed.",
    };
    await logCommunication(input, result);

    if (input.bookingId && input.notificationType) {
      await logBookingNotification({
        bookingId: input.bookingId,
        type: input.notificationType,
        channel,
        result,
      });
    }

    return result;
  }
}

export type { ProviderSendResult, SendMessageInput, MessageChannel } from "@/lib/messaging/types";
