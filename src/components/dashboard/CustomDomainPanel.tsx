"use client";

import { useState } from "react";

type CustomDomainStatus = "none" | "pending_dns" | "pending_vercel" | "active" | "misconfigured" | "error";

type DnsInstruction = {
  type: "CNAME" | "A";
  host: string;
  value: string;
};

type VercelVerification = {
  type?: string;
  domain?: string;
  value?: string;
  reason?: string;
};

type DomainResponse = {
  customDomain: string | null;
  customDomainVerified: boolean;
  customDomainStatus: CustomDomainStatus;
  customDomainError?: string | null;
  verificationHost?: string | null;
  verificationValue?: string | null;
  dnsInstructions?: DnsInstruction[];
  vercelVerification?: VercelVerification[];
  error?: string;
};

function statusLabel(status: CustomDomainStatus, verified: boolean): string {
  if (verified || status === "active") return "Ready";
  if (status === "pending_dns") return "Ownership pending";
  if (status === "pending_vercel") return "DNS pending";
  if (status === "error") return "Needs attention";
  return "Not connected";
}

export function CustomDomainPanel({
  initialDomain,
  initialVerified,
  initialStatus,
  initialError,
  initialVerificationHost,
  initialVerificationValue,
  initialDnsInstructions,
  initialVercelVerification,
}: {
  initialDomain: string | null;
  initialVerified: boolean;
  initialStatus: string;
  initialError: string | null;
  initialVerificationHost: string | null;
  initialVerificationValue: string | null;
  initialDnsInstructions: DnsInstruction[];
  initialVercelVerification: VercelVerification[];
}) {
  const [customDomain, setCustomDomain] = useState(initialDomain ?? "");
  const [verified, setVerified] = useState(initialVerified);
  const [status, setStatus] = useState<CustomDomainStatus>((initialStatus as CustomDomainStatus) ?? "none");
  const [verificationHost, setVerificationHost] = useState<string | null>(initialVerificationHost);
  const [verificationValue, setVerificationValue] = useState<string | null>(initialVerificationValue);
  const [dnsInstructions, setDnsInstructions] = useState<DnsInstruction[]>(initialDnsInstructions);
  const [vercelVerification, setVercelVerification] = useState<VercelVerification[]>(initialVercelVerification);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [saving, setSaving] = useState(false);
  const [checking, setChecking] = useState(false);

  function applyDomainState(data: DomainResponse) {
    setCustomDomain(data.customDomain ?? "");
    setVerified(Boolean(data.customDomainVerified));
    setStatus(data.customDomainStatus ?? "none");
    setVerificationHost(data.verificationHost ?? null);
    setVerificationValue(data.verificationValue ?? null);
    setDnsInstructions(data.dnsInstructions ?? []);
    setVercelVerification(data.vercelVerification ?? []);
    setError(data.customDomainError ?? "");
  }

  async function saveDomain(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/dashboard/settings/custom-domain", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customDomain: customDomain || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not save domain.");
      setSaving(false);
      return;
    }
    applyDomainState(data);
    setMessage(data.customDomain ? "Domain saved. Add the ownership TXT record, then check DNS." : "Custom domain removed.");
    setSaving(false);
  }

  async function verifyDomain() {
    setChecking(true);
    setError("");
    setMessage("");
    const res = await fetch("/api/dashboard/settings/custom-domain", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ check: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      applyDomainState(data);
      setError(data.error ?? "Could not verify domain.");
      setChecking(false);
      return;
    }
    applyDomainState(data);
    setMessage(data.customDomainVerified ? "Custom domain is live." : "DNS checked. Complete the records shown below, then check again.");
    setChecking(false);
  }

  return (
    <div className="rounded-xl border bg-white p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Custom domain</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Use a branded booking domain such as book.yoursalon.lk. Pro plan required.
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {statusLabel(status, verified)}
        </span>
      </div>
      <form onSubmit={saveDomain} className="flex flex-wrap gap-2">
        <input
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
          placeholder="book.yoursalon.lk"
          className="min-w-[16rem] flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={verifyDomain}
          disabled={!customDomain || checking}
          className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {checking ? "Checking..." : verified ? "Check again" : "Check DNS"}
        </button>
      </form>
      {verificationHost && verificationValue && status !== "active" && (
        <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-1">
          <p className="font-medium text-foreground">Ownership TXT record</p>
          <p>
            Host: <code className="font-mono">{verificationHost}</code>
          </p>
          <p>
            Value: <code className="font-mono break-all">{verificationValue}</code>
          </p>
        </div>
      )}
      {dnsInstructions.length > 0 && status !== "active" && (
        <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
          <p className="font-medium text-foreground">Traffic DNS record</p>
          {dnsInstructions.map((record) => (
            <div key={`${record.type}:${record.host}:${record.value}`} className="space-y-1">
              <p>
                Type: <code className="font-mono">{record.type}</code>
              </p>
              <p>
                Host: <code className="font-mono">{record.host}</code>
              </p>
              <p>
                Value: <code className="font-mono break-all">{record.value}</code>
              </p>
            </div>
          ))}
        </div>
      )}
      {vercelVerification.length > 0 && status !== "active" && (
        <div className="rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
          <p className="font-medium text-foreground">Vercel ownership record</p>
          {vercelVerification.map((record, index) => (
            <div key={`${record.type}:${record.domain}:${record.value}:${index}`} className="space-y-1">
              {record.type && (
                <p>
                  Type: <code className="font-mono">{record.type}</code>
                </p>
              )}
              {record.domain && (
                <p>
                  Host: <code className="font-mono">{record.domain}</code>
                </p>
              )}
              {record.value && (
                <p>
                  Value: <code className="font-mono break-all">{record.value}</code>
                </p>
              )}
              {record.reason && <p className="text-muted-foreground">{record.reason}</p>}
            </div>
          ))}
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
    </div>
  );
}
