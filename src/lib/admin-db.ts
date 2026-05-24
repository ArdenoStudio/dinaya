/** Shared helpers for platform admin server queries. */

import { businesses, subscriptions } from "@/db/schema";

export async function safeAdminQuery<T>(query: Promise<T>, fallback: T): Promise<T> {
  try {
    return await query;
  } catch (err) {
    console.error("[admin] query failed:", err instanceof Error ? err.message : err);
    return fallback;
  }
}

/** Columns used by /admin/accounts/[id] — avoids SELECT * on businesses. */
export const adminBusinessProfileSelect = {
  id: businesses.id,
  name: businesses.name,
  slug: businesses.slug,
  plan: businesses.plan,
  createdAt: businesses.createdAt,
  businessType: businesses.businessType,
  timezone: businesses.timezone,
  email: businesses.email,
  phone: businesses.phone,
  address: businesses.address,
  description: businesses.description,
  isSuspended: businesses.isSuspended,
  deletedAt: businesses.deletedAt,
} as const;

/** Columns used for subscription history on account detail. */
export const adminSubscriptionHistorySelect = {
  id: subscriptions.id,
  plan: subscriptions.plan,
  status: subscriptions.status,
  amountLkr: subscriptions.amountLkr,
  payhereOrderId: subscriptions.payhereOrderId,
  createdAt: subscriptions.createdAt,
} as const;
