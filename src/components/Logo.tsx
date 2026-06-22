import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  href?: string | null;
  className?: string;
  /** Show "Dinaya" without the .lk suffix */
  short?: boolean;
}

const ICON_SIZES = { sm: 18, md: 22, lg: 30 };
const TEXT_CLASSES = { sm: "text-base", md: "text-lg", lg: "text-xl" };

/**
 * Horizontal lockup tuned to wordmark em size (not fixed px).
 * Mark height ≈ 1.05–1.35× em with cap-height nudge; gap ≈ 0.3–0.38× em.
 * Shorter "Dinaya" uses a tighter mark + gap so the icon does not dominate.
 */
const LOCKUP = {
  sm: { mark: "h-[1.2em] w-[1.2em]", gap: "gap-[0.34em]", nudge: "translate-y-[0.04em]" },
  md: { mark: "h-[1.28em] w-[1.28em]", gap: "gap-[0.36em]", nudge: "translate-y-[0.04em]" },
  lg: { mark: "h-[1.35em] w-[1.35em]", gap: "gap-[0.38em]", nudge: "translate-y-[0.05em]" },
} as const;

const LOCKUP_SHORT = {
  sm: { mark: "h-[1.05em] w-[1.05em]", gap: "gap-[0.3em]", nudge: "translate-y-[0.04em]" },
  md: { mark: "h-[1.12em] w-[1.12em]", gap: "gap-[0.32em]", nudge: "translate-y-[0.04em]" },
  lg: { mark: "h-[1.18em] w-[1.18em]", gap: "gap-[0.34em]", nudge: "translate-y-[0.05em]" },
} as const;

export function LogoIcon({
  size = "md",
  className,
}: {
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const px = ICON_SIZES[size];
  return (
    <svg
      width={className ? undefined : px}
      height={className ? undefined : px}
      viewBox="318 319 875 866"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      fill="currentColor"
      className={className}
    >
      <path d="M 819.949219 499.695312 L 563.980469 755.773438 C 513.210938 806.554688 513.210938 889.15625 563.980469 939.941406 C 614.75 990.777344 697.378906 990.726562 748.09375 939.941406 L 966.117188 721.851562 C 982.484375 705.480469 982.484375 678.953125 966.117188 662.582031 C 949.75 646.207031 923.230469 646.207031 906.863281 662.582031 L 688.84375 880.671875 C 670.753906 898.707031 641.375 898.761719 623.234375 880.671875 C 605.144531 862.578125 605.144531 833.132812 623.234375 815.042969 L 879.203125 558.96875 C 931.742188 506.464844 1017.1875 506.464844 1069.671875 558.96875 C 1095.097656 584.425781 1109.117188 618.265625 1109.117188 654.257812 C 1109.117188 690.226562 1095.097656 724.0625 1069.671875 749.523438 L 782.496094 1036.789062 C 740.375 1078.921875 684.367188 1102.117188 624.816406 1102.117188 C 565.261719 1102.117188 509.285156 1078.921875 467.164062 1036.789062 C 380.222656 949.820312 380.222656 808.328125 467.164062 721.359375 L 797.144531 391.253906 C 813.511719 374.878906 813.511719 348.355469 797.144531 331.980469 C 780.773438 315.609375 754.257812 315.609375 737.890625 331.980469 L 407.910156 662.089844 C 288.285156 781.722656 288.285156 976.425781 407.910156 1096.058594 C 465.828125 1154.019531 542.867188 1185.945312 624.816406 1185.945312 C 706.765625 1185.945312 783.804688 1154.019531 841.746094 1096.058594 L 1128.925781 808.792969 C 1214.121094 723.570312 1214.121094 584.917969 1128.925781 499.695312 C 1043.78125 414.558594 905.144531 414.445312 819.949219 499.695312 Z" />
    </svg>
  );
}

export function Logo({ size = "md", href = "/", className, short = false }: LogoProps) {
  const lockup = short ? LOCKUP_SHORT[size] : LOCKUP[size];

  const inner = (
    <span
      className={`inline-flex items-center text-foreground ${lockup.gap} ${TEXT_CLASSES[size]} ${className ?? ""}`}
    >
      <LogoIcon className={`shrink-0 ${lockup.mark} ${lockup.nudge}`} />
      <span className="font-cal leading-none">{short ? "Dinaya" : "Dinaya.lk"}</span>
    </span>
  );

  if (href === null) {
    return <span className="inline-flex">{inner}</span>;
  }

  return (
    <Link href={href ?? "/"} className="inline-flex">
      {inner}
    </Link>
  );
}
