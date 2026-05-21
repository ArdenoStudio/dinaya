"use client";

import { cn } from "@/lib/utils";
import { DocsTargetHighlight } from "../DocsTargetHighlight";

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
    <div className="flex h-full flex-col bg-[#f2f2f7] text-[11px]">
      <div className="bg-gradient-to-b from-blue-700 to-blue-600 px-3 pb-3 pt-10">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-white/20">
            <i className="bi bi-scissors text-white text-sm" />
          </div>
          <div>
            <p className="font-semibold text-white">Dilini&apos;s Studio</p>
            <p className="text-[9px] text-blue-200">dilini.dinaya.lk</p>
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2 p-2.5">
        {step === "service" && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Choose service</p>
            {services.map((s) => (
              <DocsTargetHighlight
                key={s.name}
                active={target("booking-service-card") && s.selected}
                label="Select service"
              >
                <div
                  className={cn(
                    "rounded-xl border bg-white p-2.5",
                    s.selected ? "border-primary ring-1 ring-primary/30" : "border-transparent",
                  )}
                >
                  <div className="flex justify-between">
                    <p className="font-semibold text-gray-900">{s.name}</p>
                    <p className="font-bold text-primary">{s.price}</p>
                  </div>
                  <p className="text-gray-400">{s.duration}</p>
                </div>
              </DocsTargetHighlight>
            ))}
          </div>
        )}

        {step === "time" && (
          <div className="rounded-xl bg-white p-2.5">
            <p className="mb-2 text-[9px] font-bold uppercase text-gray-400">Pick a time</p>
            <div className="grid grid-cols-3 gap-1">
              {["9:00", "10:30", "11:00", "2:00", "3:30"].map((t, i) => (
                <DocsTargetHighlight
                  key={t}
                  active={target("booking-time-slot") && i === 2}
                  label="Time slot"
                  variant="inline"
                >
                  <span
                    className={cn(
                      "block rounded-lg py-1.5 text-center",
                      i === 2 ? "bg-primary font-semibold text-white" : "bg-gray-100 text-gray-700",
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
            <div className="rounded-xl bg-white p-2.5">
              <p className="font-semibold">Haircut & Style</p>
              <p className="text-gray-500">Thu May 15 · 11:00</p>
            </div>
            <DocsTargetHighlight active={target("booking-confirm-pay")} label="Confirm & Pay">
              <button type="button" className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 py-3 font-bold text-white shadow">
                Confirm & Pay
              </button>
            </DocsTargetHighlight>
          </div>
        )}

        {step === "manage" && (
          <div className="rounded-xl bg-white p-2.5 space-y-2">
            <p className="font-semibold">Your appointment</p>
            <p className="text-gray-500">Haircut · May 15, 11:00</p>
            <div className="flex gap-1">
              <DocsTargetHighlight active={target("booking-reschedule")} label="Reschedule" variant="inline" className="flex-1">
                <span className="block rounded-lg border py-1.5 text-center">Reschedule</span>
              </DocsTargetHighlight>
              <DocsTargetHighlight active={target("booking-cancel")} label="Cancel" variant="inline" className="flex-1">
                <span className="block rounded-lg border border-red-200 py-1.5 text-center text-red-600">
                  Cancel
                </span>
              </DocsTargetHighlight>
            </div>
          </div>
        )}

        {step === "review" && (
          <div className="rounded-xl bg-white p-2.5">
            <p className="font-semibold">Rate your visit</p>
            <DocsTargetHighlight active={target("booking-stars")} label="Star rating" placement="below">
              <div className="my-2 flex gap-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((n) => (
                  <i key={n} className="bi bi-star-fill" />
                ))}
              </div>
            </DocsTargetHighlight>
            <div className="h-12 rounded border bg-gray-50" />
          </div>
        )}
      </div>
    </div>
  );
}
