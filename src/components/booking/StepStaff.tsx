"use client";

import Image from "next/image";
import type { Staff } from "@/db/schema";
import type { BookingCopy } from "@/lib/i18n";
import { getEligibleStaff } from "@/lib/booking-staff";
import { isOptimizableRemoteImage, cn } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";

const rowFocus =
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
}

export default function StepStaff({
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
}: Props) {
  const eligible = getEligibleStaff(allStaff, staffServiceMap, serviceId, staffLocationMap, locationId);

  return (
    <div className="px-4 md:px-6 lg:px-8">
      <h2 className="mb-1 font-cal text-lg text-balance text-foreground md:text-xl">{copy.chooseTeam}</h2>
      <p className="mb-5 text-base text-muted-foreground md:text-sm">{copy.chooseTeamHint}</p>

      {eligible.length === 0 ? (
        <p className="py-8 text-center text-base text-muted-foreground md:text-sm">{copy.noStaff}</p>
      ) : (
        <div className="space-y-2">
          {onSelectAny && (
            <button
              type="button"
              onClick={onSelectAny}
              aria-pressed={anyStaffSelected}
              className={cn(
                "flex w-full min-h-11 items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                rowFocus,
                anyStaffSelected
                  ? "booking-border-accent booking-bg-accent-muted ring-2 booking-ring-accent"
                  : "border-border hover:border-[var(--booking-accent)]/50 hover:bg-muted/30",
              )}
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full booking-bg-accent-muted booking-text-accent">
                <Icon name="lightning-charge-fill" className="text-sm" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-medium text-foreground md:text-sm">{copy.anyAvailableStaff}</p>
                <p className="mt-0.5 text-sm text-muted-foreground md:text-xs">{copy.anyAvailableStaffHint}</p>
              </div>
              <div
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  anyStaffSelected
                    ? "border-[var(--booking-accent)] bg-[var(--booking-accent)]"
                    : "border-muted-foreground/30",
                )}
              >
                {anyStaffSelected && <Icon name="check" className="text-white" style={{ fontSize: "0.75rem" }} />}
              </div>
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
                  "flex w-full min-h-11 items-center gap-3 rounded-xl border px-4 py-3.5 text-left transition-all",
                  rowFocus,
                  isSelected
                    ? "booking-border-accent booking-bg-accent-muted ring-2 booking-ring-accent"
                    : "border-border hover:border-[var(--booking-accent)]/50 hover:bg-muted/30",
                )}
              >
                <div className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full booking-bg-accent-muted text-sm font-bold booking-text-accent">
                  {s.avatarUrl ? (
                    <Image
                      src={s.avatarUrl}
                      alt={s.name}
                      width={40}
                      height={40}
                      className="size-10 rounded-full object-cover"
                      unoptimized={!isOptimizableRemoteImage(s.avatarUrl)}
                    />
                  ) : (
                    s.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-medium text-foreground md:text-sm">{s.name}</p>
                  {s.bio ? (
                    <p className="mt-0.5 truncate text-sm text-muted-foreground md:text-xs">{s.bio}</p>
                  ) : null}
                </div>
                <div
                  className={cn(
                    "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                    isSelected
                      ? "border-[var(--booking-accent)] bg-[var(--booking-accent)]"
                      : "border-muted-foreground/30",
                  )}
                >
                  {isSelected && <Icon name="check" className="text-white" style={{ fontSize: "0.75rem" }} />}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
