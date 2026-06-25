export type DisplayPlan = "trial" | "starter" | "pro" | "max" | "expired" | string;

export function planDisplayName(plan: DisplayPlan): string {
  if (plan === "max") return "Growth";
  if (plan === "pro") return "Pro";
  if (plan === "starter") return "Starter";
  if (plan === "trial") return "Free trial";
  if (plan === "expired") return "Expired";
  return plan;
}
