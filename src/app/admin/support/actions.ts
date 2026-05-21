"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import crypto from "node:crypto";
import { db } from "@/db";
import { payments, users } from "@/db/schema";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { logAdminEvent } from "@/lib/admin-audit";
import {
  buildImpersonationUrl,
  createImpersonationToken,
} from "@/lib/impersonation";
import { replayWebhookDeliveryById } from "@/lib/webhook-retries";

function generateTempPassword(): string {
  return crypto
    .randomBytes(9)
    .toString("base64")
    .replace(/[+/=]/g, "")
    .slice(0, 12);
}

export type ResetPasswordResult =
  | { ok: true; tempPassword: string; email: string }
  | { ok: false; error: string };

export async function resetUserPassword(userId: string): Promise<ResetPasswordResult> {
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

export type ImpersonateResult = { ok: true; url: string } | { ok: false; error: string };

export async function startImpersonation(userId: string): Promise<ImpersonateResult> {
  const admin = await requirePlatformAdmin();
  const [target] = await db
    .select({ id: users.id, email: users.email })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!target) return { ok: false, error: "User not found." };

  const token = createImpersonationToken({
    userId: target.id,
    adminEmail: admin.email,
  });

  await logAdminEvent({
    actorEmail: admin.email,
    action: "support.impersonate",
    target: target.email,
    meta: { userId: target.id },
  });

  revalidatePath("/admin/security");
  return { ok: true, url: buildImpersonationUrl(token) };
}

export type RefundResult = { ok: true } | { ok: false; error: string };

export async function refundPayment(paymentId: string): Promise<RefundResult> {
  const admin = await requirePlatformAdmin();
  const [payment] = await db
    .select({
      id: payments.id,
      status: payments.status,
      payhereOrderId: payments.payhereOrderId,
    })
    .from(payments)
    .where(eq(payments.id, paymentId))
    .limit(1);
  if (!payment) return { ok: false, error: "Payment not found." };
  if (payment.status !== "success") {
    return { ok: false, error: "Only successful payments can be marked refunded." };
  }

  await db.update(payments).set({ status: "refunded" }).where(eq(payments.id, paymentId));

  await logAdminEvent({
    actorEmail: admin.email,
    action: "support.refund_payment",
    target: payment.payhereOrderId ?? payment.id,
    meta: { paymentId: payment.id },
  });

  revalidatePath("/admin/support");
  revalidatePath("/admin/security");
  return { ok: true };
}

export type ReplayWebhookResult = { ok: true } | { ok: false; error: string };

export async function replayWebhookDelivery(deliveryId: string): Promise<ReplayWebhookResult> {
  const admin = await requirePlatformAdmin();
  try {
    await replayWebhookDeliveryById(deliveryId);
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Replay failed.",
    };
  }

  await logAdminEvent({
    actorEmail: admin.email,
    action: "support.replay_webhook",
    target: deliveryId,
  });

  revalidatePath("/admin/webhooks");
  revalidatePath("/admin/security");
  return { ok: true };
}
