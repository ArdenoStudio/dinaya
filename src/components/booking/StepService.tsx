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
      <div className="text-center py-12 text-muted-foreground">
        No services available yet. Check back soon!
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-cal text-lg mb-4">Choose a service</h2>
      <div className="space-y-2">
        {services.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s)}
            className={`w-full text-left border rounded-lg px-4 py-3 hover:border-primary transition-colors ${
              selected?.id === s.id ? "border-primary bg-primary/5" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{s.name}</p>
                {s.description && (
                  <p className="text-muted-foreground text-xs mt-0.5">{s.description}</p>
                )}
              </div>
              <div className="text-right ml-4 flex-shrink-0">
                <p className="text-sm font-medium">{s.priceLkr > 0 ? formatLkr(s.priceLkr) : "Free"}</p>
                <p className="text-xs text-muted-foreground">{s.durationMinutes} min</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
