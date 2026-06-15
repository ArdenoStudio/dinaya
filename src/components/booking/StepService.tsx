import { formatLkr } from "@/lib/utils";
import { Icon } from "@/components/ui/Icon";
import type { BookingService } from "./BookingWizard";
import type { BookingCopy } from "@/lib/i18n";
import type { BookingRouter } from "@/lib/booking-router";

interface Props {
  services: BookingService[];
  selected: BookingService | null;
  copy: BookingCopy;
  bookingRouter?: BookingRouter | null;
  onSelect: (service: BookingService) => void;
}

export default function StepService({ services, selected, copy, bookingRouter, onSelect }: Props) {
  if (services.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {copy.noServices}
      </div>
    );
  }

  return (
    <div>
      {bookingRouter && (
        <div className="mb-5">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {bookingRouter.question}
          </p>
          <div className="space-y-2">
            {bookingRouter.options.map((o) => {
              const target = services.find((s) => s.id === o.serviceId);
              if (!target) return null;
              const isSelected = selected?.id === target.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => onSelect(target)}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-50/60 shadow-sm ring-2 ring-blue-500/10"
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                  <span className={`text-sm font-medium ${isSelected ? "text-blue-900" : "text-gray-800"}`}>
                    {o.label}
                  </span>
                  <Icon name="chevron-right" className="text-xs text-gray-300" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
        {bookingRouter ? "Or choose a service" : copy.chooseService}
      </p>
      <div className="space-y-2">
        {services.map((s) => {
          const isSelected = selected?.id === s.id;
          const depositAmount =
            s.depositPercent > 0
              ? Math.ceil((s.priceLkr * s.depositPercent) / 100)
              : s.priceLkr;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelect(s)}
              className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50/60 shadow-sm ring-2 ring-blue-500/10"
                  : "border-gray-100 hover:border-gray-200"
              }`}
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                <div
                  className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 ${
                    isSelected ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  }`}
                >
                  {isSelected && <div className="size-1.5 rounded-full bg-white" />}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${isSelected ? "text-blue-900" : "text-gray-800"}`}>
                    {s.name}
                  </p>
                  <p className="text-xs text-gray-400">{s.durationMinutes} min</p>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <span
                  className={`text-sm font-bold tabular-nums ${isSelected ? "text-blue-600" : "text-gray-600"}`}
                >
                  {s.priceLkr > 0 ? formatLkr(s.priceLkr) : "Free"}
                </span>
                {s.requiresPayment && s.priceLkr > 0 && s.depositPercent > 0 && (
                  <p className="mt-0.5 text-[10px] font-medium text-blue-500">
                    {copy.depositDue}: {formatLkr(depositAmount)}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
