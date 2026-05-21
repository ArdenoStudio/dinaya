"use client";

import { useState } from "react";

export function CustomDomainPanel({
  initialDomain,
  initialVerified,
}: {
  initialDomain: string | null;
  initialVerified: boolean;
}) {
  const [customDomain, setCustomDomain] = useState(initialDomain ?? "");
  const [verified, setVerified] = useState(initialVerified);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveDomain(e: React.FormEvent) {
    e.preventDefault();
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
      return;
    }
    setVerified(Boolean(data.customDomainVerified));
    setMessage("Domain saved. Point a CNAME to dinaya.lk, then verify.");
  }

  async function verifyDomain() {
    setError("");
    setMessage("");
    const res = await fetch("/api/dashboard/settings/custom-domain", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ verify: true }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not verify domain.");
      return;
    }
    setVerified(true);
    setMessage("Custom domain marked as verified.");
  }

  return (
    <div className="rounded-xl border bg-white p-5 space-y-3">
      <h2 className="font-semibold">Custom domain</h2>
      <p className="text-sm text-muted-foreground">
        Use your own domain (e.g. book.yoursalon.lk) for your booking page. Pro plan required.
      </p>
      <form onSubmit={saveDomain} className="flex flex-wrap gap-2">
        <input
          value={customDomain}
          onChange={(e) => setCustomDomain(e.target.value)}
          placeholder="book.yoursalon.lk"
          className="min-w-[16rem] flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Save
        </button>
        <button
          type="button"
          onClick={verifyDomain}
          disabled={!customDomain || verified}
          className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {verified ? "Verified" : "Mark verified"}
        </button>
      </form>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
    </div>
  );
}
