"use client";

import Image from "next/image";
import type { Staff } from "@/db/schema";
import type { BookingCopy } from "@/lib/i18n";
import { getEligibleStaff } from "@/lib/booking-staff";
import { isOptimizableRemoteImage } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import { cn } from "@/lib/utils";

const pillFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--booking-accent-soft)] focus-visible:ring-offset-2";

interface Props {
  allStaff: Staff[];
  staffServiceMap: { staffId: string; serviceId: string }[];
  staffLocationMap?: { staffId: string; locationId: string }[];
  locationId?: string | null;
  serviceId: string;
  selected: Staff | null;
  anyStaffSelected?: boolean;
  copy: BookingCopy;
  onSelect: (staff: Staff) => void;
  onSelectAny?: () => void;
  compact?: boolean;
}

export default function StaffPicker({
  allStaff,
  staffServiceMap,
  staffLocationMap,
  locationId,
  serviceId,
  selected,
  anyStaffSelected,
  copy,
  onSelect,
  onSelectAny,
  compact,
}: Props) {
  const eligible = getEligibleStaff(allStaff, staffServiceMap, serviceId, staffLocationMap, locationId);
  if (eligible.length <= 1) return null;

  const pillBase =
    "inline-flex min-h-11 items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out active:scale-[0.96] motion-reduce:active:scale-100";

  return (
    <div className={compact ? "mt-4" : "mb-5"}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {copy.chooseTeam}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={copy.chooseTeam}>
        {onSelectAny && (
          <button
            type="button"
            onClick={onSelectAny}
            aria-pressed={anyStaffSelected}
            className={cn(
              "inline-flex min-h-11 max-w-full flex-col items-start justify-center gap-0.5 rounded-2xl border px-3 py-2 text-left text-sm font-medium transition-[transform,background-color,border-color,box-shadow] duration-150 ease-out active:scale-[0.96] motion-reduce:active:scale-100 sm:flex-row sm:items-center sm:gap-2 sm:rounded-full sm:py-2",
              pillFocus,
              anyStaffSelected
                ? "booking-border-accent booking-bg-accent-muted booking-text-accent ring-2 booking-ring-accent"
                : "border-border bg-secondary/50 text-muted-foreground hover:border-[var(--booking-accent)]",
            )}
          >
            <span className="inline-flex items-center gap-1.5">
              <Icon name="lightning-charge-fill" className="text-xs" />
              {copy.anyAvailableStaff}
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              {copy.anyAvailableStaffHint}
            </span>
          </button>
        )}
        {eligible.map((s) => {
          const isSelected = !anyStaffSelected && selected?.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s)}
              aria-pressed={isSelected}
              className={cn(
                pillBase,
                pillFocus,
                isSelected
                  ? "booking-border-accent booking-bg-accent-muted booking-text-accent ring-2 booking-ring-accent"
                  : "border-border bg-secondary/50 text-muted-foreground hover:border-[var(--booking-accent)]",
              )}
            >
              {s.avatarUrl ? (
                <Image
                  src={s.avatarUrl}
                  alt={s.name}
                  width={24}
                  height={24}
                  className="size-6 rounded-full object-cover image-depth"
                  unoptimized={!isOptimizableRemoteImage(s.avatarUrl)}
                />
              ) : (
                <span className="flex size-6 items-center justify-center rounded-full booking-bg-accent-muted text-xs font-bold booking-text-accent">
                  {s.name.charAt(0)}
                </span>
              )}
              {s.name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
