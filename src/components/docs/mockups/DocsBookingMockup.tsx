"use client";

import { cn } from "@/lib/utils";
import { DocsTargetHighlight } from "../DocsTargetHighlight";
import { Icon } from "@/components/ui/Icon";

type Props = {
  variant: string;
  highlightTarget?: string;
};

const services = [
  { name: "Haircut & Style", duration: "45 min", price: "Rs. 2,500", selected: true },
  { name: "Facial Treatment", duration: "60 min", price: "Rs. 3,800", selected: false },
];

export function DocsBookingMockup({ variant, highlightTarget }: Props) {
  const step = variant.replace("booking-", "");
  const target = (id: string) => highlightTarget === id;

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-[#f6f7fb] text-[11px] dark:bg-neutral-950">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(120%_80%_at_20%_0%,rgba(37,99,235,0.28),transparent_70%),linear-gradient(180deg,#1e3a8a_0%,#2563eb_55%,transparent_100%)]"
        aria-hidden
      />

      <div className="relative px-3 pb-3 pt-10">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25 backdrop-blur-sm">
            <Icon name="scissors" className="text-sm text-white" />
          </div>
          <div>
            <p className="font-cal text-[13px] font-semibold tracking-tight text-white">
              Dilini&apos;s Studio
            </p>
            <p className="text-[9px] text-white/75">dilini.dinaya.lk</p>
          </div>
        </div>
      </div>

      <div className="relative flex-1 space-y-2 px-2.5 pb-2.5">
        {step === "service" && (
          <div className="space-y-1.5">
            <p className="px-0.5 text-[9px] font-semibold uppercase tracking-[0.12em] text-white/80">
              Choose service
            </p>
            {services.map((s) => (
              <DocsTargetHighlight
                key={s.name}
                active={target("booking-service-card") && s.selected}
                label="Select service"
              >
                <div
                  className={cn(
                    "rounded-2xl border bg-white/95 p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm dark:border-neutral-800 dark:bg-neutral-900/95",
                    s.selected
                      ? "border-primary ring-1 ring-primary/30"
                      : "border-transparent",
                  )}
                >
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{s.name}</p>
                    <p className="shrink-0 font-bold text-primary">{s.price}</p>
                  </div>
                  <p className="mt-0.5 text-gray-400 dark:text-gray-500">{s.duration}</p>
                </div>
              </DocsTargetHighlight>
            ))}
          </div>
        )}

        {step === "time" && (
          <div className="rounded-2xl border border-white/40 bg-white/95 p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-900/95">
            <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500">
              Pick a time
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {["9:00", "10:30", "11:00", "2:00", "3:30"].map((t, i) => (
                <DocsTargetHighlight
                  key={t}
                  active={target("booking-time-slot") && i === 2}
                  label="Time slot"
                  variant="inline"
                >
                  <span
                    className={cn(
                      "block rounded-xl py-1.5 text-center",
                      i === 2
                        ? "bg-primary font-semibold text-white"
                        : "bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-gray-300",
                    )}
                  >
                    {t}
                  </span>
                </DocsTargetHighlight>
              ))}
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-2">
            <div className="rounded-2xl border border-white/40 bg-white/95 p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-900/95">
              <p className="font-semibold text-gray-900 dark:text-gray-100">Haircut & Style</p>
              <p className="text-gray-500 dark:text-gray-400">Thu May 15 · 11:00</p>
              <p className="mt-1 font-medium text-primary">Rs. 2,500</p>
            </div>
            <DocsTargetHighlight active={target("booking-confirm-pay")} label="Confirm & Pay">
              <button
                type="button"
                className="w-full rounded-2xl bg-primary py-3 font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.35)]"
              >
                Confirm & Pay
              </button>
            </DocsTargetHighlight>
          </div>
        )}

        {step === "manage" && (
          <div className="space-y-2 rounded-2xl border border-white/40 bg-white/95 p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-900/95">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Your appointment</p>
            <p className="text-gray-500 dark:text-gray-400">Haircut · May 15, 11:00</p>
            <div className="flex gap-1.5">
              <DocsTargetHighlight
                active={target("booking-reschedule")}
                label="Reschedule"
                variant="inline"
                className="flex-1"
              >
                <span className="block rounded-xl border border-black/[0.08] py-1.5 text-center dark:border-white/10">
                  Reschedule
                </span>
              </DocsTargetHighlight>
              <DocsTargetHighlight
                active={target("booking-cancel")}
                label="Cancel"
                variant="inline"
                className="flex-1"
              >
                <span className="block rounded-xl border border-red-200 py-1.5 text-center text-red-600">
                  Cancel
                </span>
              </DocsTargetHighlight>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="rounded-2xl border border-white/40 bg-white/95 p-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.08)] dark:border-neutral-800 dark:bg-neutral-900/95">
            <p className="font-semibold text-gray-900 dark:text-gray-100">Rate your visit</p>
            <DocsTargetHighlight
              active={target("booking-stars")}
              label="Star rating"
              placement="below"
            >
              <div className="my-2 flex gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Icon key={n} name="star-fill" />
                ))}
              </div>
            </DocsTargetHighlight>
            <div className="h-12 rounded-xl border border-black/[0.06] bg-gray-50 dark:border-white/10 dark:bg-neutral-900/60" />
          </div>
        )}
      </div>
    </div>
  );
}
