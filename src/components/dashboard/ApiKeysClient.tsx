"use client";

import { useEffect, useState } from "react";

type ApiKeyRow = {
  id: string;
  name: string;
  scopes: string[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export function ApiKeysClient() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [name, setName] = useState("");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    const res = await fetch("/api/dashboard/api-keys");
    const data = await res.json();
    setKeys(Array.isArray(data) ? data : []);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function createKey(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setRawKey(null);
    const res = await fetch("/api/dashboard/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, scopes: ["bookings:read", "bookings:write"] }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Could not create key.");
      return;
    }
    setRawKey(data.rawKey);
    setName("");
    await load();
  }

  async function revoke(id: string) {
    if (!confirm("Revoke this API key?")) return;
    await fetch(`/api/dashboard/api-keys/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={createKey} className="rounded-xl border bg-white p-5 space-y-3">
        <h2 className="font-semibold">Create API key</h2>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Integration name"
          className="w-full rounded-lg border px-3 py-2 text-sm"
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {rawKey && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            Copy this key now — it won&apos;t be shown again:
            <code className="mt-2 block break-all font-mono text-xs">{rawKey}</code>
          </div>
        )}
        <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Generate key
        </button>
      </form>

      <div className="rounded-xl border bg-white divide-y">
        {loading ? (
          <p className="p-5 text-sm text-muted-foreground">Loading…</p>
        ) : keys.length === 0 ? (
          <p className="p-5 text-sm text-muted-foreground">No API keys yet.</p>
        ) : (
          keys.map((key) => (
            <div key={key.id} className="flex items-center justify-between gap-4 p-5">
              <div>
                <p className="font-medium">{key.name}</p>
                <p className="text-xs text-muted-foreground">{key.scopes.join(", ")}</p>
              </div>
              <button
                type="button"
                onClick={() => revoke(key.id)}
                disabled={Boolean(key.revokedAt)}
                className="text-xs text-red-600 hover:underline disabled:opacity-50"
              >
                {key.revokedAt ? "Revoked" : "Revoke"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
