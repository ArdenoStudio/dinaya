"use client";

import type { ReactNode } from "react";
import { SearchField, ToggleButton } from "@heroui/react";
import { cn } from "@/lib/utils";

type DashboardFilterBarProps = {
  children: ReactNode;
  trailing?: ReactNode;
  className?: string;
};

export function DashboardFilterBar({ children, trailing, className }: DashboardFilterBarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-border/70 bg-card/80 p-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex min-w-0 flex-wrap items-center gap-2">{children}</div>
      {trailing ? <div className="flex shrink-0 flex-wrap items-center gap-2">{trailing}</div> : null}
    </div>
  );
}

export function DashboardFilterSearch({
  value,
  onChange,
  placeholder,
  "aria-label": ariaLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  "aria-label": string;
  className?: string;
}) {
  return (
    <SearchField
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      className={cn("min-w-[220px] flex-1", className)}
    >
      <SearchField.Group>
        <SearchField.SearchIcon />
        <SearchField.Input placeholder={placeholder} />
        <SearchField.ClearButton />
      </SearchField.Group>
    </SearchField>
  );
}

export function DashboardFilterPill({
  isSelected,
  onChange,
  children,
}: {
  isSelected: boolean;
  onChange: (isSelected: boolean) => void;
  children: ReactNode;
}) {
  return (
    <ToggleButton
      isSelected={isSelected}
      onChange={onChange}
      className="min-h-11 rounded-full px-4 py-2 text-sm font-medium"
    >
      {children}
    </ToggleButton>
  );
}
