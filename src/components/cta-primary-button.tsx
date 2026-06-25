import Link from "next/link";
import { MARKETING_CTA_HERO } from "@/lib/marketing-copy";

interface CTAPrimaryButtonProps {
  href?: string;
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function CTAPrimaryButton({
  href = "/register",
  children,
  className = "",
  size = "lg",
}: CTAPrimaryButtonProps) {
  const sizeClasses = {
    sm: "px-5 py-2.5 text-sm gap-1.5",
    md: "px-6 py-3 text-sm gap-2",
    lg: "px-8 py-3.5 text-base gap-2.5",
  };

  return (
    <Link
      href={href}
      className={[
        "group inline-flex items-center justify-center font-medium rounded-lg",
        "bg-primary text-primary-foreground",
        "shadow-[0_2px_12px_rgba(37,99,235,0.28)]",
        "hover:-translate-y-0.5 hover:bg-primary/95",
        "hover:shadow-[0_8px_28px_rgba(37,99,235,0.42)]",
        "active:translate-y-0 active:scale-[0.96]",
        "active:shadow-[0_1px_6px_rgba(37,99,235,0.22)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "transition-[transform,box-shadow,background-color] duration-150 ease-out",
        "select-none",
        sizeClasses[size],
        className,
      ].join(" ")}
    >
      <span>{children ?? MARKETING_CTA_HERO}</span>
      <span
        aria-hidden="true"
        className="transition-transform duration-150 ease-out group-hover:translate-x-1 group-active:translate-x-0.5"
      >
        →
      </span>
    </Link>
  );
}
