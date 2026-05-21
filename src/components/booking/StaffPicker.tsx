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
  copy: BookingCopy;
  onSelect: (staff: Staff) => void;
  compact?: boolean;
}

export default function StaffPicker({
  allStaff,
  staffServiceMap,
  staffLocationMap,
  locationId,
  serviceId,
  selected,
  copy,
  onSelect,
  compact,
}: Props) {
  const eligible = getEligibleStaff(allStaff, staffServiceMap, serviceId, staffLocationMap, locationId);
  if (eligible.length <= 1) return null;

  return (
    <div className={compact ? "mt-4" : "mb-5"}>
      <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {copy.chooseTeam}
      </p>
      <div className="flex flex-wrap gap-2">
        {eligible.map((s) => {
          const isSelected = selected?.id === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/10"
                  : "border-gray-200 bg-white text-gray-600 hover:border-blue-300"
              }`}
            >
              {s.avatarUrl ? (
                <Image
                  src={s.avatarUrl}
                  alt=""
                  width={20}
                  height={20}
                  className="size-5 rounded-full object-cover"
                  unoptimized={!isOptimizableRemoteImage(s.avatarUrl)}
                />
              ) : (
                <span className="flex size-5 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
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
