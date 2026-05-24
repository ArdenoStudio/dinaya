import type { ProviderSendResult } from "@/lib/messaging/types";

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
