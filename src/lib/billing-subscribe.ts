import type { BillingInterval, PaidPlan } from "@/lib/plan";

export function parseSubscribeRequest(body: { plan?: string; interval?: string }) {
  const targetPlan: PaidPlan = body.plan === "max" ? "max" : "pro";
  const interval: BillingInterval = body.interval === "annual" ? "annual" : "monthly";
  return { targetPlan, interval };
}
