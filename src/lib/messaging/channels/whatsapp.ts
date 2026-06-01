import { providerTimeoutSignal } from "@/lib/provider-timeout";

export function isWhatsAppReady(clientPhone?: string | null): boolean {
  if (!clientPhone) return false;
  const metaReady = Boolean(
    process.env.META_WHATSAPP_TOKEN &&
    process.env.META_WHATSAPP_PHONE_NUMBER_ID,
  );
  const twilioReady = Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM,
  );
  return metaReady || twilioReady;
}

export async function sendWhatsApp(input: {
  clientPhone: string;
  body: string;
}): Promise<{ provider: string; status: "sent" | "skipped" | "failed"; providerMessageId?: string | null; error?: string }> {
  const token = process.env.META_WHATSAPP_TOKEN;
  const phoneNumberId = process.env.META_WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    return { provider: "meta-whatsapp", status: "skipped", error: "Meta WhatsApp env is not configured." };
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
    signal: providerTimeoutSignal(),
  });

  const data = await response.json().catch(() => ({})) as {
    messages?: { id?: string }[];
    error?: { message?: string };
  };

  if (!response.ok) {
    return {
      provider: "meta-whatsapp",
      status: "failed",
      error: data.error?.message ?? "WhatsApp send failed.",
    };
  }

  return {
    provider: "meta-whatsapp",
    status: "sent",
    providerMessageId: data.messages?.[0]?.id ?? null,
  };
}
