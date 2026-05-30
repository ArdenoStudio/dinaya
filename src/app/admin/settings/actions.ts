"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { requirePlatformAdminFromSession } from "@/lib/platform-admin";
import { clearAnnouncement, saveAnnouncement } from "@/lib/platform-config";
import { logAdminEvent } from "@/lib/admin-audit";

export async function updateAnnouncement(formData: FormData): Promise<void> {
  const session = await auth();
  const admin = await requirePlatformAdminFromSession(session);

  const message = String(formData.get("message") ?? "").trim();
  const toneRaw = String(formData.get("tone") ?? "info");
  const active = formData.get("active") === "on";
  const tone =
    toneRaw === "warning" || toneRaw === "critical" ? toneRaw : "info";

  if (!message) {
    await clearAnnouncement();
    await logAdminEvent({
      actorEmail: admin.email,
      action: "settings.announcement_cleared",
    });
  } else {
    await saveAnnouncement({
      message,
      tone,
      active,
      updatedAt: new Date().toISOString(),
      updatedBy: admin.email,
    });
    await logAdminEvent({
      actorEmail: admin.email,
      action: "settings.announcement_updated",
      meta: { tone, active, length: message.length },
    });
  }

  revalidatePath("/admin/settings");
}
