"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { voiceIntegrations } from "@/db/schema";
import { logAdminEvent } from "@/lib/admin-audit";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { isVoiceReceptionistStatus } from "@/lib/voice-receptionist";

function value(formData: FormData, key: string): string | null {
  const raw = String(formData.get(key) ?? "").trim();
  return raw ? raw : null;
}

export async function updateVoiceIntegration(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const id = value(formData, "id");
  const status = value(formData, "status");
  if (!id || !status || !isVoiceReceptionistStatus(status)) {
    throw new Error("Invalid voice integration update.");
  }

  const now = new Date();
  const markTested = formData.get("markTested") === "on";
  const markActivated = formData.get("markActivated") === "on" || status === "live";
  const patch = {
    status,
    providerName: value(formData, "providerName") ?? "Peak Agents",
    aiPhoneNumber: value(formData, "aiPhoneNumber"),
    setupNotes: value(formData, "setupNotes"),
    updatedAt: now,
    ...(markTested ? { lastTestedAt: now } : {}),
    ...(markActivated ? { activatedAt: now } : {}),
  };

  await db
    .update(voiceIntegrations)
    .set(patch)
    .where(eq(voiceIntegrations.id, id));

  await logAdminEvent({
    actorEmail: admin.email,
    action: "voice_integration.updated",
    target: id,
    meta: {
      status,
      providerName: value(formData, "providerName"),
      aiPhoneNumber: value(formData, "aiPhoneNumber"),
    },
  });

  revalidatePath("/admin/voice");
}
