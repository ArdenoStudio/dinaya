import { Sparkles, type LucideIcon } from "lucide-react";

type Props = {
  title: string;
  description: string;
  icon?: LucideIcon;
  features?: string[];
};

export function ComingSoon({ title, description, icon: Icon = Sparkles, features }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-cal text-3xl tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>

      <div className="rounded-xl border border-dashed bg-white p-8 sm:p-12 text-center">
        <span className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <h2 className="font-cal text-xl tracking-tight">Coming soon</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          This area is scaffolded but not yet built out. The next iteration will add the
          functionality below.
        </p>

        {features && features.length > 0 && (
          <ul className="mx-auto mt-6 grid max-w-md gap-2 text-left text-sm">
            {features.map((f) => (
              <li
                key={f}
                className="rounded-md border bg-muted/30 px-3 py-2 text-muted-foreground"
              >
                {f}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
