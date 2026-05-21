import { Resend } from "resend";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { communications } from "@/db/schema";
import type { PlanFeature } from "@/lib/plan";

type Channel = "email" | "whatsapp" | "sms";

export type ProviderSendResult = {
  channel: Channel | "none";
  provider: string | null;
  status: "sent" | "skipped" | "failed" | "duplicate";
  providerMessageId?: string | null;
  error?: string | null;
};

type SendMessageInput = {
  businessId: string;
  bookingId?: string | null;
  clientId?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  feature: PlanFeature;
  idempotencyKey: string;
  subject: string;
  body: string;
  preferredChannels?: Channel[];
  meta?: Record<string, unknown>;
};

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.RESEND_FROM ?? "noreply@dinaya.lk";

function channelReady(channel: Channel, input: SendMessageInput): boolean {
  if (channel === "email") return Boolean(resend && input.clientEmail);
  if (channel === "whatsapp") {
    return Boolean(
      input.clientPhone &&
      process.env.META_WHATSAPP_TOKEN &&
      process.env.META_WHATSAPP_PHONE_NUMBER_ID
    );
  }
  return Boolean(input.clientPhone && process.env.SMS_HTTP_ENDPOINT);
}

function selectChannel(input: SendMessageInput): Channel | null {
  const preferred = input.preferredChannels ?? ["whatsapp", "sms", "email"];
  return preferred.find((channel) => channelReady(channel, input)) ?? null;
}

async function sendViaProvider(
  channel: Channel,
  input: SendMessageInput
): Promise<Omit<ProviderSendResult, "channel">> {
  if (channel === "email") {
    if (!resend || !input.clientEmail) {
      return { provider: "resend", status: "skipped", error: "Email provider or recipient missing." };
    }
    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: input.clientEmail,
      subject: input.subject,
      text: input.body,
    });
    return {
      provider: "resend",
      status: "sent",
      providerMessageId: result.data?.id ?? null,
    };
  }

  if (channel === "whatsapp") {
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
    if (!token || !phoneNumberId || !input.clientPhone) {
      return { provider: "meta-whatsapp", status: "skipped", error: "Meta WhatsApp env or phone missing." };
    }
    const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: input.clientPhone.replace(/^\+/, ""),
        type: "text",
        text: { body: input.body },
      }),
    });
    const data = await response.json().catch(() => ({})) as { messages?: { id?: string }[]; error?: { message?: string } };
    if (!response.ok) {
      return { provider: "meta-whatsapp", status: "failed", error: data.error?.message ?? "WhatsApp send failed." };
    }
    return { provider: "meta-whatsapp", status: "sent", providerMessageId: data.messages?.[0]?.id ?? null };
  }

  const endpoint = process.env.SMS_HTTP_ENDPOINT;
  if (!endpoint || !input.clientPhone) {
    return { provider: "sms-http", status: "skipped", error: "SMS endpoint or phone missing." };
  }
  const response = await fetch(endpoint, {
    method: process.env.SMS_HTTP_METHOD ?? "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.SMS_HTTP_API_KEY ? { Authorization: `Bearer ${process.env.SMS_HTTP_API_KEY}` } : {}),
    },
    body: JSON.stringify({
      to: input.clientPhone,
      message: input.body,
      sender: process.env.SMS_HTTP_SENDER ?? "Dinaya",
    }),
  });
  const data = await response.json().catch(() => ({})) as { id?: string; messageId?: string; error?: string };
  if (!response.ok) {
    return { provider: "sms-http", status: "failed", error: data.error ?? "SMS send failed." };
  }
  return { provider: "sms-http", status: "sent", providerMessageId: data.messageId ?? data.id ?? null };
}

async function logCommunication(
  input: SendMessageInput,
  result: ProviderSendResult,
): Promise<void> {
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

export async function sendAiMessage(input: SendMessageInput): Promise<ProviderSendResult> {
  const [existing] = await db
    .select({ id: communications.id, status: communications.status })
    .from(communications)
    .where(and(
      eq(communications.businessId, input.businessId),
      eq(communications.idempotencyKey, input.idempotencyKey),
    ))
    .limit(1);

  if (existing) {
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

  try {
    const providerResult = await sendViaProvider(channel, input);
    const result = { channel, ...providerResult };
    await logCommunication(input, result);
    return result;
  } catch (error) {
    const result: ProviderSendResult = {
      channel,
      provider: channel === "email" ? "resend" : channel === "whatsapp" ? "meta-whatsapp" : "sms-http",
      status: "failed",
      error: error instanceof Error ? error.message : "Provider send failed.",
    };
    await logCommunication(input, result);
    return result;
  }
}

export async function publishSocialPost(input: {
  caption: string;
  idempotencyKey: string;
}): Promise<ProviderSendResult> {
  const pageId = process.env.META_SOCIAL_PAGE_ID;
  const token = process.env.META_SOCIAL_ACCESS_TOKEN;
  if (!pageId || !token) {
    return {
      channel: "none",
      provider: "meta-social",
      status: "skipped",
      error: "Meta social publishing env is not configured.",
    };
  }

  try {
    const response = await fetch(`https://graph.facebook.com/v20.0/${pageId}/feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: input.caption,
        access_token: token,
      }),
    });
    const data = await response.json().catch(() => ({})) as { id?: string; error?: { message?: string } };
    if (!response.ok) {
      return { channel: "none", provider: "meta-social", status: "failed", error: data.error?.message ?? "Meta publish failed." };
    }
    return { channel: "none", provider: "meta-social", status: "sent", providerMessageId: data.id ?? null };
  } catch (error) {
    return {
      channel: "none",
      provider: "meta-social",
      status: "failed",
      error: error instanceof Error ? error.message : "Meta publish failed.",
    };
  }
}
