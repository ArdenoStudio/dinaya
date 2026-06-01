import { providerTimeoutSignal } from "@/lib/provider-timeout";

export function isTwilioWhatsAppReady(clientPhone?: string | null): boolean {
  return Boolean(
    clientPhone &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_WHATSAPP_FROM,
  );
}

export async function sendTwilioWhatsApp(input: {
  clientPhone: string;
  body: string;
}): Promise<{ provider: string; status: "sent" | "skipped" | "failed"; providerMessageId?: string | null; error?: string }> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  if (!accountSid || !authToken || !from) {
    return { provider: "twilio-whatsapp", status: "skipped", error: "Twilio WhatsApp env is not configured." };
  }

  const to = input.clientPhone.startsWith("whatsapp:")
    ? input.clientPhone
    : `whatsapp:${input.clientPhone.startsWith("+") ? input.clientPhone : `+${input.clientPhone}`}`;

  const credentials = Buffer.from(`${accountSid}:${authToken}`).toString("base64");
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        From: from.startsWith("whatsapp:") ? from : `whatsapp:${from}`,
        To: to,
        Body: input.body,
      }),
      signal: providerTimeoutSignal(),
    },
  );

  const data = await response.json().catch(() => ({})) as {
    sid?: string;
    message?: string;
  };

  if (!response.ok) {
    return {
      provider: "twilio-whatsapp",
      status: "failed",
      error: data.message ?? "Twilio WhatsApp send failed.",
    };
  }

  return {
    provider: "twilio-whatsapp",
    status: "sent",
    providerMessageId: data.sid ?? null,
  };
}
