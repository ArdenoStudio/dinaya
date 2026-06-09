"use client";

import { cn } from "@/lib/utils";
import { DocsTargetHighlight } from "../DocsTargetHighlight";
import { Icon } from "@/components/ui/Icon";
import { DEMO_NUMERALS } from "./demo-theme";

type Props = {
  variant: string;
  highlightTarget?: string;
};

const services = [
  { name: "Haircut & Style", duration: "45 min", price: "Rs. 2,500", selected: true },
  { name: "Facial Treatment", duration: "60 min", price: "Rs. 3,800", selected: false },
];

const FLOW_STEPS = ["Service", "Time", "Confirm"] as const;
const STEP_INDEX: Record<string, number> = { service: 0, time: 1, confirm: 2 };

function FlowProgress({ step }: { step: string }) {
  const current = STEP_INDEX[step];
  if (current === undefined) return null;
  return (
    <div className="flex items-center gap-1 px-2.5 pb-1 pt-2">
      {FLOW_STEPS.map((label, i) => (
        <div key={label} className="flex flex-1 items-center gap-1">
          <span
            className={cn(
              "flex size-3.5 items-center justify-center rounded-full text-[7px] font-bold",
              i < current && "bg-emerald-500 text-white",
              i === current && "bg-primary text-white",
              i > current && "bg-gray-200 text-gray-400",
            )}
          >
            {i < current ? <Icon name="check" className="text-[7px]" /> : i + 1}
          </span>
          {i < FLOW_STEPS.length - 1 ? (
            <span
              className={cn(
                "h-0.5 flex-1 rounded-full",
                i < current ? "bg-emerald-500" : "bg-gray-200",
              )}
            />
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function DocsBookingMockup({ variant, highlightTarget }: Props) {
  const step = variant.replace("booking-", "");
  const target = (id: string) => highlightTarget === id;

  return (
    <div className="flex h-full flex-col bg-[#f2f2f7] text-[11px]">
      <div className="bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 px-3 pb-3 pt-9">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 backdrop-blur">
            <Icon name="scissors" className="text-white text-sm" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="truncate font-semibold text-white">Dilini&apos;s Studio</p>
              <Icon name="patch-check-fill" className="text-[10px] text-sky-200" />
            </div>
            <div className="flex items-center gap-1 text-[9px] text-blue-100">
              <Icon name="star-fill" className="text-[8px] text-amber-300" />
              <span className="font-medium text-white">4.9</span>
              <span className="text-blue-200">· dilini.dinaya.lk</span>
            </div>
          </div>
        </div>
      </div>

      <FlowProgress step={step} />

      <div className="flex-1 space-y-2 p-2.5">
        {step === "service" && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
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
                    "flex items-center gap-2 rounded-2xl border bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]",
                    s.selected ? "border-primary ring-1 ring-primary/30" : "border-gray-100",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-8 shrink-0 items-center justify-center rounded-xl",
                      s.selected ? "bg-primary/10 text-primary" : "bg-gray-100 text-gray-400",
                    )}
                  >
                    <Icon name={s.selected ? "scissors" : "droplet-half"} className="text-sm" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <p className="flex items-center gap-1 text-[9px] text-gray-400">
                      <Icon name="clock" className="text-[8px]" />
                      {s.duration}
                    </p>
                  </div>
                  <p className={cn("font-bold text-primary", DEMO_NUMERALS)}>{s.price}</p>
                </div>
              </DocsTargetHighlight>
            ))}
          </div>
        )}

        {step === "time" && (
          <div className="space-y-2">
            <div className="flex gap-1">
              {["Thu 15", "Fri 16", "Sat 17"].map((d, i) => (
                <span
                  key={d}
                  className={cn(
                    "flex-1 rounded-xl py-1 text-center text-[9px] font-medium",
                    i === 0 ? "bg-primary text-white shadow-sm" : "bg-white text-gray-500",
                  )}
                >
                  {d}
                </span>
              ))}
            </div>
            <div className="rounded-2xl bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
              <p className="mb-2 text-[9px] font-bold uppercase text-gray-400">Pick a time</p>
              <div className="grid grid-cols-3 gap-1.5">
                {["9:00", "10:30", "11:00", "2:00", "3:30", "4:45"].map((t, i) => (
                  <DocsTargetHighlight
                    key={t}
                    active={target("booking-time-slot") && i === 2}
                    label="Time slot"
                    variant="inline"
                  >
                    <span
                      className={cn(
                        "block rounded-xl py-1.5 text-center font-medium",
                        i === 2
                          ? "bg-primary text-white shadow-sm"
                          : "bg-gray-100 text-gray-700",
                        DEMO_NUMERALS,
                      )}
                    >
                      {t}
                    </span>
                  </DocsTargetHighlight>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === "confirm" && (
          <div className="space-y-2">
            <div className="rounded-2xl bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
              <p className="font-semibold text-gray-900">Haircut &amp; Style</p>
              <p className="flex items-center gap-1 text-gray-500">
                <Icon name="calendar-event-fill" className="text-[9px] text-primary" />
                Thu May 15 · 11:00
              </p>
              <div className="mt-2 space-y-1 border-t border-dashed border-gray-200 pt-2 text-[10px]">
                <div className="flex justify-between text-gray-500">
                  <span>Service</span>
                  <span className={DEMO_NUMERALS}>Rs. 2,500</span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900">
                  <span>Deposit due now</span>
                  <span className={DEMO_NUMERALS}>Rs. 500</span>
                </div>
              </div>
            </div>
            <DocsTargetHighlight active={target("booking-confirm-pay")} label="Confirm & Pay">
              <button
                type="button"
                className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 font-bold text-white shadow-md"
              >
                <Icon name="lock-fill" className="text-[10px]" />
                Confirm &amp; Pay
              </button>
            </DocsTargetHighlight>
            <p className="flex items-center justify-center gap-1 text-center text-[8px] text-gray-400">
              <Icon name="shield-fill-check" className="text-[8px] text-emerald-500" />
              Secured by PayHere
            </p>
          </div>
        )}

        {step === "manage" && (
          <div className="space-y-2 rounded-2xl bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-600">
              <Icon name="check-circle-fill" className="text-[8px]" />
              Confirmed
            </span>
            <p className="font-semibold text-gray-900">Your appointment</p>
            <p className="flex items-center gap-1 text-gray-500">
              <Icon name="calendar-event-fill" className="text-[9px] text-primary" />
              Haircut · May 15, 11:00
            </p>
            <div className="flex gap-1.5 pt-1">
              <DocsTargetHighlight
                active={target("booking-reschedule")}
                label="Reschedule"
                variant="inline"
                className="flex-1"
              >
                <span className="block rounded-xl border border-gray-200 py-1.5 text-center font-medium">
                  Reschedule
                </span>
              </DocsTargetHighlight>
              <DocsTargetHighlight
                active={target("booking-cancel")}
                label="Cancel"
                variant="inline"
                className="flex-1"
              >
                <span className="block rounded-xl border border-red-200 py-1.5 text-center font-medium text-red-600">
                  Cancel
                </span>
              </DocsTargetHighlight>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="rounded-2xl bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
            <p className="font-semibold text-gray-900">Rate your visit</p>
            <p className="text-[9px] text-gray-400">Haircut &amp; Style · Dilini&apos;s Studio</p>
            <DocsTargetHighlight active={target("booking-stars")} label="Star rating" placement="below">
              <div className="my-2 flex gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Icon key={n} name="star-fill" className="text-sm" />
                ))}
              </div>
            </DocsTargetHighlight>
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-2 text-[9px] text-gray-400">
              Tell others about your experience…
            </div>
            <button
              type="button"
              className="mt-2 w-full rounded-xl bg-primary py-2 text-[10px] font-semibold text-white"
            >
              Submit review
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
