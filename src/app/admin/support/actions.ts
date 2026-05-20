"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { logAdminEvent } from "@/lib/admin-audit";

function generateTempPassword(): string {
  // 12-char base32-ish password with mixed entropy
  return crypto
    .randomBytes(9)
    .toString("base64")
    .replace(/[+/=]/g, "")
    .slice(0, 12);
}

export type ResetPasswordResult =
  | { ok: true; tempPassword: string; email: string }
  | { ok: false; error: string };

export async function resetUserPassword(
  userId: string
): Promise<ResetPasswordResult> {
  const admin = await requirePlatformAdmin();

  const [target] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!target) {
    return { ok: false, error: "User not found." };
  }

  const tempPassword = generateTempPassword();
  const hash = await bcrypt.hash(tempPassword, 10);

  await db.update(users).set({ passwordHash: hash }).where(eq(users.id, userId));

  await logAdminEvent({
    actorEmail: admin.email,
    action: "support.reset_password",
    target: target.email,
    meta: { userId: target.id },
  });

  revalidatePath("/admin/support");
  revalidatePath("/admin/security");
  return { ok: true, tempPassword, email: target.email };
}
