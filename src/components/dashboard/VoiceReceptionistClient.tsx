"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, KeyRound, PhoneCall, Save, ShieldCheck } from "lucide-react";
import {
  VOICE_API_SCOPES,
  VOICE_LANGUAGES,
  voiceStatusLabel,
  type VoiceLanguage,
} from "@/lib/voice-receptionist";

type VoiceIntegrationPayload = {
  aiPhoneNumber: string | null;
  activatedAt: string | null;
  bookingRules: string | null;
  businessPhone: string | null;
  fallbackMessage: string | null;
  faqNotes: string | null;
  handoffPhone: string | null;
  languages: VoiceLanguage[];
  lastTestedAt: string | null;
  openingRules: string | null;
  providerName: string;
  requestedAt: string | null;
  serviceRules: string | null;
  setupNotes: string | null;
  status: string;
  updatedAt: string;
  welcomeMessage: string | null;
};

type ApiResponse = {
  available: boolean;
  businessPhone: string | null;
  integration: VoiceIntegrationPayload | null;
  requiredPlan: "max";
};

type FormState = {
  bookingRules: string;
  businessPhone: string;
  fallbackMessage: string;
  faqNotes: string;
  handoffPhone: string;
  languages: VoiceLanguage[];
  openingRules: string;
  serviceRules: string;
  welcomeMessage: string;
};

const DEFAULT_FORM: FormState = {
  bookingRules: "",
  businessPhone: "",
  fallbackMessage: "I can take a message and ask the team to call you back.",
  faqNotes: "",
  handoffPhone: "",
  languages: ["en"],
  openingRules: "Use Dinaya availability as the source of truth before offering a time.",
  serviceRules: "Only offer active services shown by Dinaya.",
  welcomeMessage: "Hi, thanks for calling. I can help you book an appointment.",
};

function toForm(data: ApiResponse | null): FormState {
  const integration = data?.integration;
  return {
    bookingRules: integration?.bookingRules ?? DEFAULT_FORM.bookingRules,
    businessPhone: integration?.businessPhone ?? data?.businessPhone ?? "",
    fallbackMessage: integration?.fallbackMessage ?? DEFAULT_FORM.fallbackMessage,
    faqNotes: integration?.faqNotes ?? DEFAULT_FORM.faqNotes,
    handoffPhone: integration?.handoffPhone ?? data?.businessPhone ?? "",
    languages: integration?.languages?.length ? integration.languages : DEFAULT_FORM.languages,
    openingRules: integration?.openingRules ?? DEFAULT_FORM.openingRules,
    serviceRules: integration?.serviceRules ?? DEFAULT_FORM.serviceRules,
    welcomeMessage: integration?.welcomeMessage ?? DEFAULT_FORM.welcomeMessage,
  };
}

function formatTimestamp(value: string | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

export function VoiceReceptionistClient() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [keyLoading, setKeyLoading] = useState(false);
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const status = data?.integration?.status ?? "not_requested";
  const statusLabel = voiceStatusLabel(status);
  const statusClass = status === "live"
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : status === "paused"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  const scopeText = useMemo(() => VOICE_API_SCOPES.join(", "), []);

  async function load() {
    const res = await fetch("/api/dashboard/voice-receptionist");
    const next = await res.json() as ApiResponse;
    setData(next);
    setForm(toForm(next));
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  function toggleLanguage(language: VoiceLanguage) {
    setForm((current) => {
      const next = current.languages.includes(language)
        ? current.languages.filter((item) => item !== language)
        : [...current.languages, language];
      return {
        ...current,
        languages: next.length > 0 ? next : [language],
      };
    });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/dashboard/voice-receptionist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const next = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(next.error ?? "Could not save voice setup.");
      return;
    }
    setData((current) => ({
      ...(current ?? { available: true, businessPhone: form.businessPhone, requiredPlan: "max" as const }),
      integration: next.integration,
    }));
    setMessage("Voice setup request saved.");
  }

  async function generateVoiceKey() {
    setKeyLoading(true);
    setError("");
    setRawKey(null);
    const res = await fetch("/api/dashboard/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "AI Voice Receptionist",
        scopes: VOICE_API_SCOPES,
      }),
    });
    const next = await res.json();
    setKeyLoading(false);
    if (!res.ok) {
      setError(next.error ?? "Could not generate voice API key.");
      return;
    }
    setRawKey(next.rawKey);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading voice setup…</p>;
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <form onSubmit={save} className="space-y-5">
        <div className="rounded-xl border bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                <PhoneCall className="size-4 text-primary" aria-hidden="true" />
                Call setup
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                These details become the provider handoff pack for the phone agent.
              </p>
            </div>
            <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass}`}>
              {statusLabel}
            </span>
          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium">Business phone</span>
              <input
                value={form.businessPhone}
                onChange={(e) => setForm((current) => ({ ...current, businessPhone: e.target.value }))}
                className="mt-1 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="+94..."
                required
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium">Human handoff phone</span>
              <input
                value={form.handoffPhone}
                onChange={(e) => setForm((current) => ({ ...current, handoffPhone: e.target.value }))}
                className="mt-1 h-10 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="+94..."
                required
              />
            </label>
          </div>

          <div className="mt-5">
            <span className="text-sm font-medium">Languages</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {VOICE_LANGUAGES.map((language) => (
                <label
                  key={language.value}
                  className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={form.languages.includes(language.value)}
                    onChange={() => toggleLanguage(language.value)}
                    className="size-4 rounded border-muted-foreground/30 text-primary focus:ring-primary"
                  />
                  {language.label}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="font-semibold">Conversation rules</h2>
          <div className="mt-4 grid gap-4">
            {[
              ["welcomeMessage", "Welcome message"],
              ["fallbackMessage", "Fallback message"],
              ["openingRules", "Opening rules"],
              ["serviceRules", "Service rules"],
              ["bookingRules", "Booking rules"],
              ["faqNotes", "FAQ notes"],
            ].map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-sm font-medium">{label}</span>
                <textarea
                  value={form[key as keyof FormState] as string}
                  onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))}
                  className="mt-1 min-h-24 w-full rounded-md border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
              </label>
            ))}
          </div>
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          <Save className="size-4" aria-hidden="true" />
          {saving ? "Saving…" : "Save setup request"}
        </button>
      </form>

      <aside className="space-y-4">
        <div className="rounded-xl border bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="size-4 text-primary" aria-hidden="true" />
            Provider handoff
          </h2>
          <dl className="mt-4 space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Provider</dt>
              <dd className="font-medium">{data?.integration?.providerName ?? "Peak Agents"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">AI phone number</dt>
              <dd className="font-medium">{data?.integration?.aiPhoneNumber ?? "Pending setup"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Requested</dt>
              <dd className="font-medium">{formatTimestamp(data?.integration?.requestedAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Last tested</dt>
              <dd className="font-medium">{formatTimestamp(data?.integration?.lastTestedAt)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Activated</dt>
              <dd className="font-medium">{formatTimestamp(data?.integration?.activatedAt)}</dd>
            </div>
            {data?.integration?.setupNotes ? (
              <div>
                <dt className="text-muted-foreground">Platform notes</dt>
                <dd className="whitespace-pre-wrap font-medium">{data.integration.setupNotes}</dd>
              </div>
            ) : null}
            <div>
              <dt className="text-muted-foreground">Scopes</dt>
              <dd className="font-mono text-xs">{scopeText}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded-xl border bg-white p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <KeyRound className="size-4 text-primary" aria-hidden="true" />
            Voice API key
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate one key per provider setup and revoke it if the provider changes.
          </p>
          {rawKey ? (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
              <p className="font-medium text-amber-900">Copy this key now.</p>
              <code className="mt-2 block break-all font-mono text-xs text-amber-950">{rawKey}</code>
            </div>
          ) : null}
          <button
            type="button"
            onClick={generateVoiceKey}
            disabled={keyLoading}
            className="mt-4 inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
          >
            <KeyRound className="size-4" aria-hidden="true" />
            {keyLoading ? "Generating…" : "Generate voice key"}
          </button>
        </div>

        {status === "live" ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            <CheckCircle2 className="mb-2 size-4" aria-hidden="true" />
            Voice receptionist is marked live by platform admin.
          </div>
        ) : null}
      </aside>
    </div>
  );
}
