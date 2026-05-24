"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Icon } from "@/components/ui/Icon";
import { buildPublicBookingUrlLabel } from "@/lib/booking-url";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const STEPS = [
  { id: 1, label: "Business details", description: "Phone, address, and description clients will see." },
  { id: 2, label: "First service", description: "Review and save your first bookable service." },
  { id: 3, label: "Availability", description: "Confirm the days and hours clients can book." },
  { id: 4, label: "Go live", description: "Your booking page is ready — share it with clients." },
];

const inputCls =
  "mt-1.5 w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 placeholder:text-gray-300 transition-all";

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

export function SetupWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
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

  useEffect(() => {
    fetch("/api/dashboard/onboarding")
      .then((r) => r.json())
      .then((data: SetupData) => {
        if (data.completed) {
          router.replace("/dashboard");
          return;
        }
        const initialStep = Math.max(1, Math.min(4, (data.business.onboardingStep || 0) + 1));
        setStep(initialStep);
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
        setError("Could not load setup. Please refresh.");
        setLoading(false);
      });
  }, [router]);

  async function persistStep(nextStep: number) {
    await fetch("/api/dashboard/onboarding", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: nextStep }),
    });
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
      setError(data.error ?? "Could not save business details.");
      setSaving(false);
      return;
    }
    await persistStep(1);
    setStep(2);
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
      setError(data.error ?? "Could not save service.");
      setSaving(false);
      return;
    }
    await persistStep(2);
    setStep(3);
    setSaving(false);
  }

  async function handleStep3(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId) {
      setError("No staff found. Please contact support.");
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
      setError(data.error ?? "Could not save availability.");
      setSaving(false);
      return;
    }
    await persistStep(3);
    setStep(4);
    setSaving(false);
  }

  async function handleFinish() {
    setSaving(true);
    setError("");
    const res = await fetch("/api/dashboard/onboarding", { method: "POST" });
    if (!res.ok) {
      setError("Could not complete setup.");
      setSaving(false);
      return;
    }
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

  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`Book online with ${details.name}: ${bookingUrl}`)}`;
  const progress = Math.round((step / STEPS.length) * 100);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f4f1]">
        <Icon name="arrow-repeat" className="animate-spin text-2xl text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f4f1]">
      <header className="border-b bg-white px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Logo size="sm" />
          <span className="text-xs font-medium text-muted-foreground">Step {step} of 4</span>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-widest text-primary">Get live in minutes</p>
          <h1 className="mt-2 font-cal text-3xl tracking-tight">{STEPS[step - 1].label}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{STEPS[step - 1].description}</p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-white ring-1 ring-gray-200">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div
          className="rounded-2xl bg-white px-7 py-8"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 8px 32px rgba(0,0,0,0.07)" }}
        >
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="biz-name">Business name</label>
                <input
                  id="biz-name"
                  required
                  value={details.name}
                  onChange={(e) => setDetails((d) => ({ ...d, name: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="phone">Phone (WhatsApp)</label>
                <input
                  id="phone"
                  required
                  placeholder="+94771234567"
                  value={details.phone}
                  onChange={(e) => setDetails((d) => ({ ...d, phone: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="address">Address</label>
                <input
                  id="address"
                  required
                  placeholder="123 Galle Road, Colombo"
                  value={details.address}
                  onChange={(e) => setDetails((d) => ({ ...d, address: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="description">Short description</label>
                <textarea
                  id="description"
                  required
                  rows={3}
                  placeholder="Tell clients what you offer..."
                  value={details.description}
                  onChange={(e) => setDetails((d) => ({ ...d, description: e.target.value }))}
                  className={inputCls}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Continue"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                We pre-filled a starter service based on your business type. Edit it to match what you offer.
              </p>
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="svc-name">Service name</label>
                <input
                  id="svc-name"
                  required
                  value={service.name}
                  onChange={(e) => setService((s) => ({ ...s, name: e.target.value }))}
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="duration">Duration (min)</label>
                  <input
                    id="duration"
                    type="number"
                    min={5}
                    required
                    value={service.durationMinutes}
                    onChange={(e) => setService((s) => ({ ...s, durationMinutes: Number(e.target.value) }))}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700" htmlFor="price">Price (LKR)</label>
                  <input
                    id="price"
                    type="number"
                    min={0}
                    required
                    value={service.priceLkr}
                    onChange={(e) => setService((s) => ({ ...s, priceLkr: Number(e.target.value) }))}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700" htmlFor="svc-desc">Description</label>
                <textarea
                  id="svc-desc"
                  rows={2}
                  value={service.description}
                  onChange={(e) => setService((s) => ({ ...s, description: e.target.value }))}
                  className={inputCls}
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="rounded-lg border px-4 py-3 text-sm font-medium">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save & continue"}
                </button>
              </div>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleStep3} className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Confirm when clients can book. You can change this anytime from Availability.
              </p>
              <div className="flex flex-wrap gap-2">
                {DAY_NAMES.map((name, day) => {
                  const active = availRows.some((r) => r.dayOfWeek === day);
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleDay(day)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                        active ? "border-primary bg-primary/10 text-primary" : "bg-white text-muted-foreground"
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
              <div className="space-y-2">
                {availRows.map((row, index) => (
                  <div key={row.dayOfWeek} className="flex items-center gap-3 rounded-lg border p-3">
                    <span className="w-10 text-sm font-medium">{DAY_NAMES[row.dayOfWeek]}</span>
                    <input
                      type="time"
                      value={row.startTime}
                      onChange={(e) => updateAvailRow(index, "startTime", e.target.value)}
                      className="rounded border px-2 py-1 text-sm"
                    />
                    <span className="text-muted-foreground">to</span>
                    <input
                      type="time"
                      value={row.endTime}
                      onChange={(e) => updateAvailRow(index, "endTime", e.target.value)}
                      className="rounded border px-2 py-1 text-sm"
                    />
                  </div>
                ))}
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)} className="rounded-lg border px-4 py-3 text-sm font-medium">
                  Back
                </button>
                <button
                  type="submit"
                  disabled={saving || availRows.length === 0}
                  className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Confirm hours"}
                </button>
              </div>
            </form>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <div className="rounded-xl border bg-emerald-50/60 p-5 text-center">
                <Icon name="check-circle-fill" className="text-3xl text-emerald-600" />
                <h2 className="mt-3 font-cal text-xl">Your page is live!</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Clients can book at{" "}
                  <a href={bookingUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
                    {bookingDisplayUrl}
                  </a>
                </p>
              </div>

              <div className="overflow-hidden rounded-xl border">
                <iframe src={bookingUrl} title="Booking page preview" className="h-64 w-full border-0 bg-white" />
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:border-primary/40"
                >
                  <Icon name="box-arrow-up-right" className="text-xs" />
                  Open booking page
                </a>
                <a
                  href={whatsappShare}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium hover:border-primary/40"
                >
                  <Icon name="whatsapp" className="text-emerald-600" />
                  Share on WhatsApp
                </a>
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(3)} className="rounded-lg border px-4 py-3 text-sm font-medium">
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={saving}
                  className="flex-1 rounded-lg bg-primary py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                >
                  {saving ? "Finishing…" : "Go to dashboard"}
                </button>
              </div>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Need help?{" "}
          <Link href="/docs/guides/setup-booking-page" className="text-primary hover:underline">
            Read the setup guide
          </Link>
        </p>
      </main>
    </div>
  );
}
