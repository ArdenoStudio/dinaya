"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

interface Props {
  label: string;
  href?: string;
  onClick?: () => void;
}

export function BookingBackPill({ label, href, onClick }: Props) {
  const className =
    "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/95 px-3.5 py-1.5 text-sm font-medium text-muted-foreground shadow-sm backdrop-blur-sm transition-colors hover:border-border hover:bg-card hover:text-foreground";

  if (href) {
    return (
      <Link href={href} className={className}>
        <Icon name="chevron-left" className="text-xs" />
        {label}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      <Icon name="chevron-left" className="text-xs" />
      {label}
    </button>
  );
}
