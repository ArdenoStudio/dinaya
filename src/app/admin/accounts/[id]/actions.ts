"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { businesses } from "@/db/schema";
import { requirePlatformAdminFromSession } from "@/lib/platform-admin";
import { logAdminEvent } from "@/lib/admin-audit";

export type ModerationResult = { ok: true } | { ok: false; error: string };

async function getBusiness(businessId: string) {
  const [biz] = await db
    .select({
      id: businesses.id,
      slug: businesses.slug,
      isSuspended: businesses.isSuspended,
      deletedAt: businesses.deletedAt,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  return biz ?? null;
}

export async function suspendAccount(businessId: string): Promise<ModerationResult> {
  const session = await auth();
  const admin = await requirePlatformAdminFromSession(session);
  const biz = await getBusiness(businessId);

  if (!biz) {
    return { ok: false, error: "Account not found." };
  }
  if (biz.deletedAt) {
    return { ok: false, error: "Account is deleted." };
  }
  if (biz.isSuspended) {
    return { ok: false, error: "Account is already suspended." };
  }

  await db
    .update(businesses)
    .set({ isSuspended: true })
    .where(eq(businesses.id, businessId));

  await logAdminEvent({
    actorEmail: admin.email,
    action: "account.suspend",
    target: biz.slug,
    meta: { businessId },
  });

  revalidatePath(`/admin/accounts/${businessId}`);
  revalidatePath("/admin/accounts");
  return { ok: true };
}

export async function unsuspendAccount(businessId: string): Promise<ModerationResult> {
  const session = await auth();
  const admin = await requirePlatformAdminFromSession(session);
  const biz = await getBusiness(businessId);

  if (!biz) {
    return { ok: false, error: "Account not found." };
  }
  if (biz.deletedAt) {
    return { ok: false, error: "Account is deleted." };
  }
  if (!biz.isSuspended) {
    return { ok: false, error: "Account is not suspended." };
  }

  await db
    .update(businesses)
    .set({ isSuspended: false })
    .where(eq(businesses.id, businessId));

  await logAdminEvent({
    actorEmail: admin.email,
    action: "account.unsuspend",
    target: biz.slug,
    meta: { businessId },
  });

  revalidatePath(`/admin/accounts/${businessId}`);
  revalidatePath("/admin/accounts");
  return { ok: true };
}

export async function softDeleteAccount(businessId: string): Promise<ModerationResult> {
  const session = await auth();
  const admin = await requirePlatformAdminFromSession(session);
  const biz = await getBusiness(businessId);

  if (!biz) {
    return { ok: false, error: "Account not found." };
  }
  if (biz.deletedAt) {
    return { ok: false, error: "Account is already deleted." };
  }

  await db
    .update(businesses)
    .set({
      deletedAt: new Date(),
      isSuspended: true,
    })
    .where(eq(businesses.id, businessId));

  await logAdminEvent({
    actorEmail: admin.email,
    action: "account.soft_delete",
    target: biz.slug,
    meta: { businessId },
  });

  revalidatePath(`/admin/accounts/${businessId}`);
  revalidatePath("/admin/accounts");
  return { ok: true };
}
