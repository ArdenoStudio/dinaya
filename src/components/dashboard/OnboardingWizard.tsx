import Link from "next/link";
import { Icon } from "@/components/ui/Icon";
import { dashboardOutlineActionClass, dashboardPrimaryActionClass } from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

type OnboardingStep = {
  label: string;
  done: boolean;
  href: string;
  description: string;
};

interface Props {
  steps: OnboardingStep[];
  bookingUrl: string;
  whatsappShare: string;
}

function ctaForStep(label: string): string {
  switch (label) {
    case "Add your page details":
      return "Add your page details";
    case "Add what clients can book":
      return "Add your first service";
    case "Who takes bookings":
      return "Add who takes bookings";
    case "Set booking hours":
      return "Set booking hours";
    case "Connect PayHere":
      return "Connect PayHere";
    case "Share your booking link":
      return "Share your booking link";
    default:
      return label;
  }
}

export function OnboardingWizard({ steps, bookingUrl, whatsappShare }: Props) {
  const completed = steps.filter((step) => step.done).length;
  const nextStep = steps.find((step) => !step.done) ?? steps[steps.length - 1];
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <div className="overflow-hidden rounded-xl border bg-card p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Your booking page in 5 minutes
          </p>
          <h2 className="mt-1 font-cal text-2xl tracking-tight">Get more bookings</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {completed} of {steps.length} done — your link is almost ready to share
          </p>
        </div>
        <div className="rounded-full bg-background px-3 py-1 text-sm font-semibold ring-1 ring-primary/15 dark:ring-primary/25">
          {progress}%
        </div>
      </div>

      <div className="mb-6 h-2 overflow-hidden rounded-full bg-background ring-1 ring-border dark:bg-neutral-800">
        <div
          className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Growth checklist progress"
        />
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-5 dark:border-neutral-800">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Do this next</p>
        <h3 className="mt-1 font-semibold">{nextStep.label}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{nextStep.description}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={nextStep.href}
            target={nextStep.href.startsWith("http") ? "_blank" : undefined}
            className={dashboardPrimaryActionClass}
          >
            {ctaForStep(nextStep.label)}
            <Icon name="arrow-right" className="text-xs" />
          </Link>
          {nextStep.label === "Share your booking link" ? (
            <a
              href={whatsappShare}
              target="_blank"
              rel="noopener noreferrer"
              className={dashboardOutlineActionClass}
            >
              <Icon name="whatsapp" className="text-emerald-600" />
              Share on WhatsApp
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {steps.map((step) => (
          <Link
            key={step.label}
            href={step.href}
            target={step.href.startsWith("http") ? "_blank" : undefined}
            className={cn(
              "flex min-h-11 items-center justify-between rounded-lg border px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              step.done
                ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/40"
                : "bg-background hover:border-primary/30 dark:bg-neutral-900",
            )}
          >
            <span>{step.label}</span>
            <Icon
              name={step.done ? "check-circle-fill" : "circle"}
              className={step.done ? "text-emerald-600" : "text-muted-foreground"}
            />
          </Link>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Your live booking link:{" "}
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
          {bookingUrl.replace(/^https?:\/\//, "")}
        </a>
      </p>
    </div>
  );
}
