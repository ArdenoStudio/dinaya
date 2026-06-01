import { providerTimeoutSignal } from "@/lib/provider-timeout";

export function isSmsReady(clientPhone?: string | null): boolean {
  return Boolean(clientPhone && process.env.SMS_HTTP_ENDPOINT);
}

export async function sendSms(input: {
  clientPhone: string;
  body: string;
}): Promise<{ provider: string; status: "sent" | "skipped" | "failed"; providerMessageId?: string | null; error?: string }> {
  const endpoint = process.env.SMS_HTTP_ENDPOINT;
  if (!endpoint) {
    return { provider: "sms-http", status: "skipped", error: "SMS endpoint is not configured." };
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
    signal: providerTimeoutSignal(),
  });

  const data = await response.json().catch(() => ({})) as { id?: string; messageId?: string; error?: string };
  if (!response.ok) {
    return { provider: "sms-http", status: "failed", error: data.error ?? "SMS send failed." };
  }

  return {
    provider: "sms-http",
    status: "sent",
    providerMessageId: data.messageId ?? data.id ?? null,
  };
}
