import type { Service } from "@/db/schema";
import { formatLkr } from "@/lib/utils";

interface Props {
  services: Service[];
  selected: Service | null;
  onSelect: (service: Service) => void;
}

export default function StepService({ services, selected, onSelect }: Props) {
  if (services.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No services available yet. Check back soon!
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-cal text-lg mb-4 text-balance">Choose a service</h2>
      <div className="space-y-2">
        {services.map((s) => {
          const isSelected = selected?.id === s.id;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`w-full text-left rounded-lg px-4 py-3.5 border transition-all ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/[0.03]"
                  : "hover:border-primary/50 hover:bg-muted/30"
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm">{s.name}</p>
                  {s.description && (
                    <p className="text-muted-foreground text-xs mt-0.5 truncate">{s.description}</p>
                  )}
                  <p className="flex items-center gap-1 text-xs text-muted-foreground/70 mt-1">
                    <i className="bi bi-clock shrink-0" style={{ fontSize: '0.75rem' }} />
                    {s.durationMinutes} min
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {s.priceLkr > 0 ? formatLkr(s.priceLkr) : "Free"}
                    </p>
                  </div>
                  <div
                    className={`size-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                      isSelected
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    }`}
                  >
                    {isSelected && <i className="bi bi-check text-white" style={{ fontSize: '0.75rem' }} />}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
