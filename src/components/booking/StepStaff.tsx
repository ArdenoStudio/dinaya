import type { Staff } from "@/db/schema";
import type { BookingCopy } from "@/lib/i18n";

interface Props {
  allStaff: Staff[];
  staffServiceMap: { staffId: string; serviceId: string }[];
  serviceId: string;
  selected: Staff | null;
  copy: BookingCopy;
  onSelect: (staff: Staff) => void;
  onBack: () => void;
}

export default function StepStaff({
  allStaff,
  staffServiceMap,
  serviceId,
  selected,
  copy,
  onSelect,
  onBack,
}: Props) {
  const eligibleIds = new Set(
    staffServiceMap.filter((m) => m.serviceId === serviceId).map((m) => m.staffId)
  );
  const eligible = allStaff.filter((s) => eligibleIds.has(s.id));

  return (
    <div>
      <h2 className="font-cal text-lg mb-4 text-balance">{copy.chooseTeam}</h2>

      {eligible.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          {copy.noStaff}
        </p>
      ) : (
        <div className="space-y-2">
          {eligible.map((s) => {
            const isSelected = selected?.id === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelect(s)}
                className={`w-full text-left rounded-lg px-4 py-3.5 border flex items-center gap-3 transition-all ${
                  isSelected
                    ? "border-primary ring-2 ring-primary/20 bg-primary/[0.03]"
                    : "hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <div className="size-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm shrink-0 overflow-hidden">
                  {s.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.avatarUrl} alt={s.name} className="size-10 rounded-full object-cover" />
                  ) : (
                    s.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{s.name}</p>
                  {s.bio && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{s.bio}</p>
                  )}
                </div>
                <div
                  className={`size-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "border-primary bg-primary"
                      : "border-muted-foreground/30"
                  }`}
                >
                  {isSelected && <i className="bi bi-check text-white" style={{ fontSize: '0.75rem' }} />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={onBack}
        className="mt-5 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <i className="bi bi-chevron-left text-sm" /> {copy.back}
      </button>
    </div>
  );
}
