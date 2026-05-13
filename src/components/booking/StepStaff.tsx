import type { Staff } from "@/db/schema";

interface Props {
  allStaff: Staff[];
  staffServiceMap: { staffId: string; serviceId: string }[];
  serviceId: string;
  selected: Staff | null;
  onSelect: (staff: Staff) => void;
  onBack: () => void;
}

export default function StepStaff({
  allStaff,
  staffServiceMap,
  serviceId,
  selected,
  onSelect,
  onBack,
}: Props) {
  const eligibleIds = new Set(
    staffServiceMap.filter((m) => m.serviceId === serviceId).map((m) => m.staffId)
  );
  const eligible = allStaff.filter((s) => eligibleIds.has(s.id));

  return (
    <div>
      <h2 className="font-cal text-lg mb-4">Choose a team member</h2>

      {eligible.length === 0 ? (
        <p className="text-muted-foreground text-sm text-center py-8">
          No staff available for this service.
        </p>
      ) : (
        <div className="space-y-2">
          {eligible.map((s) => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className={`w-full text-left border rounded-lg px-4 py-3 flex items-center gap-3 hover:border-primary transition-colors ${
                selected?.id === s.id ? "border-primary bg-primary/5" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-sm flex-shrink-0">
                {s.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.avatarUrl} alt={s.name} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  s.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-medium text-sm">{s.name}</p>
                {s.bio && <p className="text-xs text-muted-foreground mt-0.5">{s.bio}</p>}
              </div>
            </button>
          ))}
        </div>
      )}

      <button onClick={onBack} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
        ← Back
      </button>
    </div>
  );
}
