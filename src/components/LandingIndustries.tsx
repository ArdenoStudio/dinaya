import { Icon } from "@/components/ui/Icon";

const industries = [
  { icon: "scissors", label: "Salons & barbers" },
  { icon: "hospital", label: "Clinics" },
  { icon: "book-half", label: "Tuition" },
  { icon: "heart-pulse", label: "Wellness & spas" },
  { icon: "palette", label: "Bridal & beauty" },
] as const;

export function LandingIndustries() {
  return (
    <section className="border-t">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <p className="text-center text-sm text-muted-foreground mb-6">
          Made for Sri Lankan service businesses
        </p>
        <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
          {industries.map((item) => (
            <li
              key={item.label}
              className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80"
            >
              <Icon name={item.icon} className="text-base text-primary" />
              {item.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
