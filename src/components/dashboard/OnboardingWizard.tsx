import Link from "next/link";

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

export function OnboardingWizard({ steps, bookingUrl, whatsappShare }: Props) {
  const completed = steps.filter((step) => step.done).length;
  const nextStep = steps.find((step) => !step.done) ?? steps[steps.length - 1];
  const progress = Math.round((completed / steps.length) * 100);

  return (
    <div className="overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6 shadow-sm">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Get live in 5 minutes</p>
          <h2 className="mt-1 font-cal text-2xl tracking-tight">Finish your setup</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {completed}/{steps.length} steps complete
          </p>
        </div>
        <div className="rounded-full bg-white px-3 py-1 text-sm font-semibold ring-1 ring-primary/15">
          {progress}%
        </div>
      </div>

      <div className="mb-5 h-2 overflow-hidden rounded-full bg-white ring-1 ring-gray-200">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="rounded-xl border bg-white p-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Next step</p>
        <h3 className="mt-1 font-semibold">{nextStep.label}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{nextStep.description}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href={nextStep.href}
            target={nextStep.href.startsWith("http") ? "_blank" : undefined}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            Continue setup
            <i className="bi bi-arrow-right text-xs" />
          </Link>
          {nextStep.label === "Share booking link" ? (
            <a
              href={whatsappShare}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:border-primary/40"
            >
              <i className="bi bi-whatsapp text-emerald-600" />
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
            className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
              step.done ? "border-emerald-200 bg-emerald-50/60" : "bg-white hover:border-primary/30"
            }`}
          >
            <span>{step.label}</span>
            <i className={`bi ${step.done ? "bi-check-circle-fill text-emerald-600" : "bi-circle text-muted-foreground"}`} />
          </Link>
        ))}
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        Your booking link:{" "}
        <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
          {bookingUrl.replace(/^https?:\/\//, "")}
        </a>
      </p>
    </div>
  );
}
