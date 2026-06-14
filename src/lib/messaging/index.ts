import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { communications } from "@/db/schema";
import { sendEmail, isEmailReady } from "@/lib/messaging/channels/email";
import { sendSms, isSmsReady } from "@/lib/messaging/channels/sms";
import { sendWhatsApp, isWhatsAppReady } from "@/lib/messaging/channels/whatsapp";
import { sendTwilioWhatsApp, isTwilioWhatsAppReady } from "@/lib/messaging/channels/twilio-whatsapp";
import { hasBookingNotification, logBookingNotification } from "@/lib/messaging/notification-log";
import { getWhatsAppUsageThisMonth, whatsappAllowanceState } from "@/lib/messaging/usage";
import { getBusinessPlan, getEffectiveEntitlements } from "@/lib/plan";
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

/**
 * WhatsApp is the dominant variable cost, so when a business has used up its
 * plan's monthly WhatsApp allowance we skip WhatsApp and let the next ready
 * channel (SMS or email) carry the message — a soft cap, never a hard stop.
 * Gated behind MESSAGING_ENFORCE_ALLOWANCE so launch runs observe-only (metering
 * on, behavior unchanged) until real usage data says to turn it on.
 */
async function isOverWhatsAppAllowance(businessId: string): Promise<boolean> {
  const plan = await getBusinessPlan(businessId);
  const included = getEffectiveEntitlements(plan).limits.whatsappMessagesPerMonth;
  if (included === null) return false; // unlimited
  const used = await getWhatsAppUsageThisMonth(businessId);
  return whatsappAllowanceState(used, included).isOver;
}

async function selectChannel(input: SendMessageInput): Promise<MessageChannel | null> {
  const enforce = process.env.MESSAGING_ENFORCE_ALLOWANCE === "true";
  const preferred = input.preferredChannels ?? ["email"];
  for (const channel of preferred) {
    if (!channelReady(channel, input)) continue;
    if (channel === "whatsapp" && enforce && (await isOverWhatsAppAllowance(input.businessId))) {
      continue;
    }
    return channel;
  }
  return null;
}

async function sendViaChannel(
  channel: MessageChannel,
  input: SendMessageInput,
): Promise<Omit<ProviderSendResult, "channel">> {
  if (channel === "email" && input.clientEmail) {
    const result = await sendEmail({
      clientEmail: input.clientEmail,
      subject: input.subject,
      body: typeof input.meta?.emailText === "string" ? input.meta.emailText : input.body,
      html: typeof input.meta?.html === "string" ? input.meta.html : undefined,
    });
    return result;
  }

  if (channel === "whatsapp" && input.clientPhone) {
    const metaResult = await sendWhatsApp({ clientPhone: input.clientPhone, body: input.body, template: input.whatsappTemplate });
    if (metaResult.status === "sent") return metaResult;
    if (isTwilioWhatsAppReady(input.clientPhone)) {
      return sendTwilioWhatsApp({ clientPhone: input.clientPhone, body: input.body });
    }
    return metaResult;
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
    const channel = await selectChannel(input);
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

  const channel = await selectChannel(input);
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
