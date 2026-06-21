import { Icon } from "@/components/ui/Icon";

const industries = [
  { icon: "scissors", label: "Salons" },
  { icon: "hospital", label: "Clinics" },
  { icon: "book-half", label: "Tuition" },
  { icon: "heart-pulse", label: "Wellness" },
] as const;

export function LandingIndustries() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12 border-t">
      <p className="text-center text-sm text-muted-foreground mb-3">Also works for</p>
      <div className="flex flex-wrap justify-center gap-3">
        {industries.map((item) => (
          <div
            key={item.label}
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm"
          >
            <Icon name={item.icon} className="text-base text-primary" />
            {item.label}
          </div>
        ))}
      </div>
    </section>
  );
}
