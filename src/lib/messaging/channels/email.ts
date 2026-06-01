import { Resend } from "resend";
import { withProviderTimeout } from "@/lib/provider-timeout";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const EMAIL_FROM = process.env.RESEND_FROM ?? "noreply@dinaya.lk";

export function isEmailReady(clientEmail?: string | null): boolean {
  return Boolean(resend && clientEmail);
}

export async function sendEmail(input: {
  clientEmail: string;
  subject: string;
  body: string;
  html?: string;
}): Promise<{ provider: string; status: "sent" | "skipped" | "failed"; providerMessageId?: string | null; error?: string }> {
  if (!resend) {
    return { provider: "resend", status: "skipped", error: "Resend is not configured." };
  }

  const result = await withProviderTimeout(
    resend.emails.send({
      from: EMAIL_FROM,
      to: input.clientEmail,
      subject: input.subject,
      text: input.body,
      html: input.html ?? undefined,
    }),
    "Resend email send",
  );

  return {
    provider: "resend",
    status: "sent",
    providerMessageId: result.data?.id ?? null,
  };
}
