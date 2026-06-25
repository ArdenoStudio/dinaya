"use client";

import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
};

export function BookingSubmitButton({
  children,
  loading = false,
  loadingLabel = "Booking…",
  disabled = false,
  onClick,
  type = "button",
  className,
}: Props) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-[var(--booking-accent)] px-4 py-3.5 text-base font-semibold text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent-soft)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
    >
      {loading ? (
        <>
          <Icon name="arrow-repeat" className="animate-spin text-sm" aria-hidden />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
