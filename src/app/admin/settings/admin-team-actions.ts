"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { invitePlatformAdminMember, revokePlatformAdminMember } from "@/lib/platform-admin-members";
import { logAdminEvent } from "@/lib/admin-audit";

export async function inviteAdminMember(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const email = String(formData.get("email") ?? "").trim();

  const result = await invitePlatformAdminMember({
    email,
    invitedBy: admin.email,
  });

  if (!result.ok) {
    throw new Error(result.error);
  }

  await logAdminEvent({
    actorEmail: admin.email,
    action: "admin.member_invited",
    target: email.toLowerCase(),
  });

  revalidatePath("/admin/settings");
}

export async function revokeAdminMember(formData: FormData): Promise<void> {
  const admin = await requirePlatformAdmin();
  const memberId = String(formData.get("memberId") ?? "");

  const revoked = await revokePlatformAdminMember(memberId);
  if (revoked) {
    await logAdminEvent({
      actorEmail: admin.email,
      action: "admin.member_revoked",
      target: memberId,
    });
  }

  revalidatePath("/admin/settings");
}
