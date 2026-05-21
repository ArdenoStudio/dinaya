import type { PlanTier } from "@content/docs/types";
import { cn } from "@/lib/utils";

const styles: Record<PlanTier, string> = {
  free: "bg-gray-100 text-gray-700 ring-gray-200",
  pro: "bg-blue-50 text-blue-700 ring-blue-200",
  max: "bg-violet-50 text-violet-700 ring-violet-200",
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
      {plan}
    </span>
  );
}
