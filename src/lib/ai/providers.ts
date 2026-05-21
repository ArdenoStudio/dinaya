import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { communications } from "@/db/schema";
import { sendMessage } from "@/lib/messaging";
import type { PlanFeature } from "@/lib/plan";
import type { ProviderSendResult, SendMessageInput } from "@/lib/messaging/types";
import { publishSocialPost } from "@/lib/messaging/social";

export type { ProviderSendResult };

type AiSendMessageInput = SendMessageInput & {
  feature: PlanFeature;
};

export async function sendAiMessage(input: AiSendMessageInput): Promise<ProviderSendResult> {
  const [existing] = await db
    .select({ id: communications.id })
    .from(communications)
    .where(and(
      eq(communications.businessId, input.businessId),
      eq(communications.idempotencyKey, input.idempotencyKey),
    ))
    .limit(1);

  if (existing) {
    return { channel: "none", provider: null, status: "duplicate" };
  }

  return sendMessage({
    ...input,
    preferredChannels: input.preferredChannels ?? ["whatsapp", "sms", "email"],
  });
}

export { publishSocialPost };
