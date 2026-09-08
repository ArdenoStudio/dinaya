"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { AuthThemeToggle } from "@/components/AuthThemeToggle";
import { DashboardCheckbox, DashboardTextAreaField, DashboardTextField } from "@/components/dashboard/DashboardFormField";
import { SetupWizardSkeleton } from "@/components/dashboard/SetupWizardSkeleton";
import { CalendarCheck, CheckCircle2, Clipboard, ExternalLink, MessageCircle, RefreshCw } from "lucide-react";
import { buildPublicBookingUrlLabel } from "@/lib/booking-url";
import {
  dashboardErrorAlertClass,
  dashboardFilterPillClass,
  dashboardInputClass,
  dashboardOutlineActionClass,
  dashboardPrimaryActionClass,
  dashboardSectionClass,
} from "@/lib/dashboard-ui";
import {
  trackOnboardingComplete,
  trackOnboardingLinkCopy,
  trackOnboardingSetupStart,
  trackOnboardingStepComplete,
  trackOnboardingTestBookClick,
  trackOnboardingWhatsappShare,
} from "@/lib/analytics/gtag";
import { cn } from "@/lib/utils";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STEPS = [
  {
    id: 1,
    label: "Your page info",
    description: "WhatsApp, address, and a short line about what you do.",
    cta: "Save & add your first service",
    savingCta: "Saving your page details…",
  },
  {
    id: 2,
    label: "What clients book",
    description: "Name, price in LKR, and how long it takes.",
    cta: "Save service & set hours",
    savingCta: "Saving your service…",
  },
  {
    id: 3,
    label: "When clients can book",
    description: "Pick the days and times that match your shop hours.",
    cta: "Save hours — almost live",
    savingCta: "Saving booking hours…",
  },
  {
    id: 4,
    label: "Share your link",
    description: "Your page is live — send the link on WhatsApp or drop it in your Instagram bio.",
    cta: "Open my dashboard",
    savingCta: "Saving…",
  },
] as const;

type AvailRow = { dayOfWeek: number; startTime: string; endTime: string };

type SetupData = {
  business: {
    name: string;
    slug: string;
    description: string | null;
    phone: string | null;
    address: string | null;
    onboardingStep: number;
  };
  firstService: {
    id: string;
    name: string;
    durationMinutes: number;
    priceLkr: number;
    description: string | null;
  } | null;
  staffList: { id: string; name: string }[];
  availabilityRows: AvailRow[];
  bookingUrl: string;
  completed: boolean;
};

function BookingPreviewFrame({ bookingUrl }: { bookingUrl: string }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (!loaded) setFailed(true);
    }, 12_000);
    return () => window.clearTimeout(timer);
  }, [loaded]);

  if (failed) {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3 rounded-xl border bg-muted/30 p-6 text-center">
        <ExternalLink className="size-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Preview could not load in this panel.</p>
        <a
          href={bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(dashboardOutlineActionClass, "min-h-11")}
        >
          Preview booking page
        </a>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border">
      {!loaded ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-muted/40">
          <RefreshCw className="size-5 animate-spin motion-reduce:animate-none text-primary" />
        </div>
      ) : null}
      <iframe
        src={bookingUrl}
        title="Booking page preview"
        className="h-64 w-full border-0 bg-card"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  );
}

export function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [bookingDisplayUrl, setBookingDisplayUrl] = useState("");

  const [details, setDetails] = useState({
    name: "",
    description: "",
    phone: "",
    address: "",
  });

  const [service, setService] = useState({
    id: "",
    name: "",
    durationMinutes: 30,
    priceLkr: 1500,
    description: "",
  });

  const [staffId, setStaffId] = useState("");
  const [availRows, setAvailRows] = useState<AvailRow[]>([]);
  const [businessSlug, setBusinessSlug] = useState("");
  const [confirmDefaultHours, setConfirmDefaultHours] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/onboarding")
      .then((r) => {
        if (!r.ok) throw new Error("load failed");
        return r.json();
      })
      .then((data: SetupData) => {
        if (data.completed) {
          router.replace("/dashboard");
          return;
        }
        const initialStep = Math.max(1, Math.min(4, (data.business.onboardingStep || 0) + 1));
        setStep(initialStep);
        setBusinessSlug(data.business.slug);
        trackOnboardingSetupStart({
          resumeStep: initialStep,
          businessSlug: data.business.slug,
        });
        setDetails({
          name: data.business.name,
          description: data.business.description ?? "",
          phone: data.business.phone ?? "",
          address: data.business.address ?? "",
        });
        if (data.firstService) {
          setService({
            id: data.firstService.id,
            name: data.firstService.name,
            durationMinutes: data.firstService.durationMinutes,
            priceLkr: data.firstService.priceLkr,
            description: data.firstService.description ?? "",
          });
        }
        setStaffId(data.staffList[0]?.id ?? "");
        setAvailRows(
          data.availabilityRows.length > 0
            ? data.availabilityRows
            : [1, 2, 3, 4, 5].map((d) => ({ dayOfWeek: d, startTime: "09:00", endTime: "17:00" })),
        );
        setBookingUrl(data.bookingUrl);
        setBookingDisplayUrl(
          buildPublicBookingUrlLabel({
            slug: data.business.slug,
            customDomain: null,
            customDomainVerified: false,
          }),
        );
        setLoading(false);
      })
      .catch(() => {
        setLoadFailed(true);
        setLoading(false);
      });
  }, [router]);

  async function persistStep(nextStep: number) {
    const res = await fetch("/api/dashboard/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: nextStep }),
    });
    if (!res.ok) {
      throw new Error("progress");
    }
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch("/api/dashboard/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: details.name,
        description: details.description || null,
        phone: details.phone || null,
        address: details.address || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Couldn't save your page details. Check the fields and try again.");
      setSaving(false);
      return;
    }
    try {
      await persistStep(1);
      trackOnboardingStepComplete({ step: 1, businessSlug });
      setStep(2);
    } catch {
      setError("Couldn't save your progress. Refresh and try again.");
    }
    setSaving(false);
  }

  async function handleStep2(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await fetch(`/api/dashboard/services/${service.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: service.name,
        durationMinutes: service.durationMinutes,
        priceLkr: service.priceLkr,
        description: service.description || null,
      }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Couldn't save your service. Check the name, price, and duration.");
      setSaving(false);
      return;
    }
    try {
      await persistStep(2);
      trackOnboardingStepComplete({ step: 2, businessSlug });
      setStep(3);
    } catch {
      setError("Couldn't save your progress. Refresh and try again.");
    }
    setSaving(false);
  }

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId) {
      setError("We couldn't find your profile for booking hours. Refresh the page and try again.");
      return;
    }
    setSaving(true);
    setError("");
    const res = await fetch("/api/dashboard/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ staffId, rows: availRows }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Couldn't save your booking hours. Pick at least one day and try again.");
      setSaving(false);
      return;
    }
    try {
      await persistStep(3);
      trackOnboardingStepComplete({ step: 3, businessSlug });
      setStep(4);
    } catch {
      setError("Couldn't save your progress. Refresh and try again.");
    }
    setSaving(false);
  }

  async function handleFinish() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/dashboard/onboarding", { method: "POST" });
    if (!res.ok) {
      setError("Couldn't finish — your page may already be live. Refresh, or open your dashboard.");
      setSaving(false);
      return;
    }
    trackOnboardingStepComplete({ step: 4, businessSlug });
    trackOnboardingComplete({ businessSlug });
    router.push("/dashboard?onboarded=1");
    router.refresh();
  }

  function toggleDay(day: number) {
    if (availRows.some((r) => r.dayOfWeek === day)) {
      setAvailRows((rows) => rows.filter((r) => r.dayOfWeek !== day));
    } else {
      setAvailRows((rows) =>
        [...rows, { dayOfWeek: day, startTime: "09:00", endTime: "17:00" }].sort(
          (a, b) => a.dayOfWeek - b.dayOfWeek,
        ),
      );
    }
  }

  function updateAvailRow(index: number, field: "startTime" | "endTime", value: string) {
    setAvailRows((rows) => rows.map((r, i) => (i === index ? { ...r, [field]: value } : r)));
  }

  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`Book ${details.name} online — pick a time here: ${bookingUrl}`)}`;
  const progress = Math.round((step / STEPS.length) * 100);
  const currentStep = STEPS[step - 1];

  if (loading) {
    return <SetupWizardSkeleton />;
  }

  if (loadFailed) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b border-border bg-card px-6 py-4">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <Logo size="sm" />
            <AuthThemeToggle />
          </div>
        </header>
        <main className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 py-16 text-center">
          <p className="text-base text-muted-foreground">
            Couldn&apos;t load your booking page setup. Check your connection and try again.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className={cn(dashboardPrimaryActionClass, "mt-6 justify-center")}
          >
            Retry
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="border-b border-border bg-card px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <Logo size="sm" />
          <div className="flex items-center justify-between gap-3 sm:justify-end">
            <span className="truncate text-xs font-medium text-muted-foreground">
              Step {step} of 4
            </span>
            <AuthThemeToggle />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl scroll-pb-28 px-6 py-10 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">
            Your booking page in 5 minutes
          </p>
          <h1 className="mt-2 font-cal text-3xl tracking-tight">{currentStep.label}</h1>
          <p className="mt-2 text-[17px] leading-snug text-muted-foreground sm:text-sm">{currentStep.description}</p>
          <div
            className="mt-4 h-2 overflow-hidden rounded-full bg-card ring-1 ring-border"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Setup progress"
          >
            <div
              className="h-full rounded-full bg-primary transition-[width] motion-reduce:transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className={cn(dashboardSectionClass, "px-6 py-8")}>
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4" aria-busy={saving}>
              <p className="text-[17px] leading-snug text-muted-foreground sm:text-sm">
                Your page is already live at{" "}
                <span className="font-medium text-foreground">{bookingDisplayUrl || "yourname.dinaya.lk"}</span>.
                Add WhatsApp so clients can reach you — address and intro can wait.
              </p>
              <DashboardTextField
                label="Business name"
                isRequired
                value={details.name}
                onChange={(value) => setDetails((d) => ({ ...d, name: value }))}
              />
              <DashboardTextField
                label="WhatsApp number (shown on your page)"
                isRequired
                type="tel"
                hint="Clients use this to confirm bookings or ask a quick question. We don't spam or share it."
                placeholder="+94771234567"
                value={details.phone}
                onChange={(value) => setDetails((d) => ({ ...d, phone: value }))}
              />
              <DashboardTextField
                label="Shop address"
                hint="Helps clients find you. You can add this later in Settings."
                placeholder="123 Galle Road, Colombo"
                value={details.address}
                onChange={(value) => setDetails((d) => ({ ...d, address: value }))}
              />
              <DashboardTextAreaField
                label="What you offer (one line)"
                rows={3}
                placeholder="e.g. Haircuts, colour, and bridal styling in Colombo 7"
                value={details.description}
                onChange={(value) => setDetails((d) => ({ ...d, description: value }))}
              />
              {error ? (
                <p role="alert" className={dashboardErrorAlertClass}>
                  {error}
                </p>
              ) : null}
              <div className="sticky bottom-0 -mx-6 mt-6 border-t border-border bg-card px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button
                  type="submit"
                  disabled={saving}
                  className={cn(dashboardPrimaryActionClass, "w-full justify-center")}
                >
                  {saving ? currentStep.savingCta : currentStep.cta}
                </button>
              </div>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-4" aria-busy={saving}>
              <p className="text-[17px] leading-snug text-muted-foreground sm:text-sm">
                We added a starter service for you. Change the name, LKR price, and duration to match what you
                actually offer.
              </p>
              <DashboardTextField
                label="Service name"
                isRequired
                value={service.name}
                onChange={(value) => setService((s) => ({ ...s, name: value }))}
              />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DashboardTextField
                  label="Duration (min)"
                  type="number"
                  min={5}
                  isRequired
                  value={String(service.durationMinutes)}
                  onChange={(value) => setService((s) => ({ ...s, durationMinutes: Number(value) }))}
                />
                <DashboardTextField
                  label="Price (LKR)"
                  type="number"
                  min={0}
                  isRequired
                  value={String(service.priceLkr)}
                  onChange={(value) => setService((s) => ({ ...s, priceLkr: Number(value) }))}
                />
              </div>
              <DashboardTextAreaField
                label="Description"
                rows={2}
                value={service.description}
                onChange={(value) => setService((s) => ({ ...s, description: value }))}
              />
              {error ? (
                <p role="alert" className={dashboardErrorAlertClass}>
                  {error}
                </p>
              ) : null}
              <div className="sticky bottom-0 -mx-6 mt-6 flex gap-3 border-t border-border bg-card px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button type="button" onClick={() => setStep(1)} className={dashboardOutlineActionClass}>
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={cn(dashboardPrimaryActionClass, "flex-1 justify-center")}
                >
                  {saving ? currentStep.savingCta : currentStep.cta}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3} className="space-y-4" aria-busy={saving}>
              <p className="text-[17px] leading-snug text-muted-foreground sm:text-sm">
                We pre-filled Mon–Sat 9:00–17:00. Confirm to continue, or edit hours below.
              </p>
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
                <DashboardCheckbox
                  isSelected={confirmDefaultHours}
                  onChange={setConfirmDefaultHours}
                  label="Use default hours (Mon–Sat 9:00–17:00)"
                />
              </div>
              {!confirmDefaultHours ? (
                <>
                  <div className="flex flex-wrap gap-2">
                    {DAY_NAMES.map((name, day) => {
                      const active = availRows.some((r) => r.dayOfWeek === day);
                      return (
                        <button
                          key={name}
                          type="button"
                          onClick={() => toggleDay(day)}
                          className={dashboardFilterPillClass(active)}
                          aria-pressed={active}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                  <div className="space-y-2">
                    {availRows.map((row, index) => (
                      <div
                        key={row.dayOfWeek}
                        className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center sm:gap-3"
                      >
                        <span className="w-10 text-sm font-medium">{DAY_NAMES[row.dayOfWeek]}</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="time"
                            value={row.startTime}
                            onChange={(e) => updateAvailRow(index, "startTime", e.target.value)}
                            className={cn(dashboardInputClass, "mt-0 w-auto min-h-11 py-2")}
                          />
                          <span className="text-muted-foreground">to</span>
                          <input
                            type="time"
                            value={row.endTime}
                            onChange={(e) => updateAvailRow(index, "endTime", e.target.value)}
                            className={cn(dashboardInputClass, "mt-0 w-auto min-h-11 py-2")}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : null}
              {error ? (
                <p role="alert" className={dashboardErrorAlertClass}>
                  {error}
                </p>
              ) : null}
              <div className="sticky bottom-0 -mx-6 mt-6 flex gap-3 border-t border-border bg-card px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button type="button" onClick={() => setStep(2)} className={dashboardOutlineActionClass}>
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving || availRows.length === 0}
                  className={cn(dashboardPrimaryActionClass, "flex-1 justify-center")}
                >
                  {saving ? currentStep.savingCta : confirmDefaultHours ? "Confirm hours" : currentStep.cta}
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="space-y-6" aria-busy={saving}>
              <div className="rounded-xl border bg-emerald-50 p-5 text-center dark:bg-emerald-950/40">
                <CheckCircle2 className="mx-auto size-8 text-emerald-600" />
                <h2 className="mt-3 font-cal text-xl">Your booking link is live</h2>
                <p className="mt-2 text-base text-muted-foreground sm:text-sm">
                  Clients can book here:{" "}
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-primary hover:underline"
                  >
                    {bookingDisplayUrl}
                  </a>
                </p>
              </div>

              <BookingPreviewFrame bookingUrl={bookingUrl} />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className={cn(dashboardOutlineActionClass, "min-h-11")}
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(bookingUrl);
                      trackOnboardingLinkCopy({ source: "setup_wizard" });
                    } catch {
                      /* ignore */
                    }
                  }}
                >
                  <Clipboard className="size-3.5" />
                  Copy link
                </button>
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(dashboardOutlineActionClass, "min-h-11")}
                  onClick={() => trackOnboardingTestBookClick({ businessSlug })}
                >
                  <CalendarCheck className="size-3.5" />
                  Book yourself (test)
                </a>
                <a
                  href={whatsappShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(dashboardOutlineActionClass, "min-h-11")}
                  onClick={() => trackOnboardingWhatsappShare({ source: "setup_wizard" })}
                >
                  <MessageCircle className="size-4 text-emerald-600" />
                  Share on WhatsApp
                </a>
              </div>

              {error ? (
                <p role="alert" className={dashboardErrorAlertClass}>
                  {error}
                </p>
              ) : null}
              <div className="sticky bottom-0 -mx-6 mt-6 flex gap-3 border-t border-border bg-card px-6 py-4 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                <button type="button" onClick={() => setStep(3)} className={dashboardOutlineActionClass}>
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={saving}
                  className={cn(dashboardPrimaryActionClass, "flex-1 justify-center")}
                >
                  {saving ? currentStep.savingCta : currentStep.cta}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Stuck?{" "}
          <Link href="/docs/guides/setup-booking-page" className="text-primary hover:underline">
            Read the setup guide
          </Link>
        </p>
      </main>
    </div>
  );
}
