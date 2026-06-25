"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type BookingBreadcrumbItem = {
  label: string;
  href?: string;
  onClick?: () => void;
  current?: boolean;
};

type Props = {
  items: BookingBreadcrumbItem[];
  className?: string;
};

export function BookingBreadcrumb({ items, className }: Props) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Booking progress" className={cn("min-w-0", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const isCurrent = item.current ?? isLast;

          const labelClass = cn(
            "truncate max-w-[14rem] sm:max-w-[18rem]",
            isCurrent
              ? "font-medium text-foreground"
              : "text-muted-foreground transition-colors hover:text-foreground",
          );

          let crumb: React.ReactNode;
          if (item.href && !isCurrent) {
            crumb = (
              <Link href={item.href} className={cn(labelClass, "hover:underline underline-offset-4")}>
                {item.label}
              </Link>
            );
          } else if (item.onClick && !isCurrent) {
            crumb = (
              <button
                type="button"
                onClick={item.onClick}
                className={cn(labelClass, "hover:underline underline-offset-4")}
              >
                {item.label}
              </button>
            );
          } else {
            crumb = (
              <span className={labelClass} aria-current={isCurrent ? "page" : undefined}>
                {item.label}
              </span>
            );
          }

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
              {index > 0 ? (
                <span aria-hidden className="text-muted-foreground/45 select-none">
                  /
                </span>
              ) : null}
              {crumb}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
