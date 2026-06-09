import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type Variant = "tip" | "note" | "warning";

const VARIANT_STYLES: Record<
  Variant,
  { container: string; label: string; icon: string; title: string }
> = {
  tip: {
    container: "border-blue-100 bg-blue-50/60",
    label: "text-blue-700",
    icon: "cursor-fill",
    title: "Where to click",
  },
  note: {
    container: "border-gray-200 bg-gray-50/80",
    label: "text-gray-600",
    icon: "info-circle",
    title: "Note",
  },
  warning: {
    container: "border-amber-200 bg-amber-50/70",
    label: "text-amber-800",
    icon: "exclamation-triangle",
    title: "Important",
  },
};

type Props = {
  variant?: Variant;
  title?: string;
  children: React.ReactNode;
  className?: string;
};

export function DocsCallout({ variant = "tip", title, children, className }: Props) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className={cn("rounded-xl border p-3.5", styles.container, className)}>
      <p className={cn("flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest", styles.label)}>
        <Icon name={styles.icon} className="text-xs" />
        {title ?? styles.title}
      </p>
      <div className="mt-1.5 text-sm leading-relaxed text-gray-900">{children}</div>
    </div>
  );
}
