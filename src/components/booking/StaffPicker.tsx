"use client";

import Image from "next/image";
import type { Staff } from "@/db/schema";
import type { BookingCopy } from "@/lib/i18n";
import { getEligibleStaff } from "@/lib/booking-staff";
import { isOptimizableRemoteImage } from "@/lib/utils";

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

  return (
    <div className={compact ? "mt-4" : "mb-5"}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500">
        {copy.chooseTeam}
      </p>
      <div className="flex flex-wrap gap-2" role="group" aria-label={copy.chooseTeam}>
        {onSelectAny && (
          <button
            type="button"
            onClick={onSelectAny}
            aria-pressed={anyStaffSelected}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
              anyStaffSelected
                ? "booking-border-accent booking-bg-accent-muted booking-text-accent ring-2 booking-ring-accent"
                : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"
            }`}
          >
            {copy.anyAvailableStaff}
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
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? "booking-border-accent booking-bg-accent-muted booking-text-accent ring-2 booking-ring-accent"
                  : "border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-600 dark:text-gray-400 hover:border-blue-300"
              }`}
            >
              {s.avatarUrl ? (
                <Image
                  src={s.avatarUrl}
                  alt={s.name}
                  width={20}
                  height={20}
                  className="size-5 rounded-full object-cover"
                  unoptimized={!isOptimizableRemoteImage(s.avatarUrl)}
                />
              ) : (
                <span className="flex size-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold booking-text-accent">
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
