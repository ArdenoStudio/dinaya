import type { PlanTier } from "@content/docs/types";
import { cn } from "@/lib/utils";

const planLabels: Record<PlanTier, string> = {
  free: "Free",
  pro: "Pro",
  max: "Growth",
};

const styles: Record<PlanTier, string> = {
  free: "bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300 ring-gray-200 dark:ring-neutral-700",
  pro: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-blue-200 dark:ring-blue-800/50",
  max: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-300 ring-violet-200 dark:ring-violet-800/50",
};

type Props = {
  plan: PlanTier;
  className?: string;
};

export function PlanBadge({ plan, className }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1",
        styles[plan],
        className,
      )}
    >
      {planLabels[plan]}
    </span>
  );
}
