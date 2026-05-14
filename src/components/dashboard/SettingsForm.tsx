"use client";

import { useState } from "react";
import type { Business } from "@/db/schema";

interface Props { business: Business; }

export default function SettingsForm({ business }: Props) {
  const [form, setForm] = useState({
    name: business.name,
    description: business.description ?? "",
    phone: business.phone ?? "",
    address: business.address ?? "",
    payhereEnabled: business.payhereEnabled,
    payhereMerchantId: business.payhereMerchantId ?? "",
    payhereMerchantSecret: business.payhereMerchantSecret ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/dashboard/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Error saving.");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div className="max-w-lg">
      <form onSubmit={handleSave} className="bg-white border rounded-xl p-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Business name *</label>
          <input required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none" rows={3}
            placeholder="Tell clients about your business…" />
        </div>
        <div>
          <label className="text-sm font-medium">Phone</label>
          <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="+94 77 000 0000" />
        </div>
        <div>
          <label className="text-sm font-medium">Address</label>
          <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
            className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="123 Main St, Colombo 03" />
        </div>

        <div className="border-t pt-4 space-y-3">
          <div>
            <p className="text-sm font-medium mb-1">PayHere</p>
            <p className="text-xs text-muted-foreground mb-3">
              Accept online payments via{" "}
              <a href="https://www.payhere.lk" target="_blank" rel="noopener noreferrer" className="underline">
                PayHere
              </a>
              . Enter your Merchant ID and Secret from the PayHere dashboard.
            </p>
            <label className="flex items-center gap-2 cursor-pointer mb-3">
              <input
                type="checkbox"
                checked={form.payhereEnabled}
                onChange={(e) => setForm((f) => ({ ...f, payhereEnabled: e.target.checked }))}
                className="rounded"
              />
              <span className="text-sm">Enable PayHere for this business</span>
            </label>
          </div>
          {form.payhereEnabled && (
            <div className="space-y-3 pl-6 border-l-2 border-primary/20">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Merchant ID</label>
                <input
                  value={form.payhereMerchantId}
                  onChange={(e) => setForm((f) => ({ ...f, payhereMerchantId: e.target.value }))}
                  placeholder="123456"
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Merchant Secret</label>
                <input
                  type="password"
                  value={form.payhereMerchantSecret}
                  onChange={(e) => setForm((f) => ({ ...f, payhereMerchantSecret: e.target.value }))}
                  placeholder="••••••••••••••••"
                  className="mt-1 w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-1 border-t">
          <p className="text-xs text-muted-foreground mb-1">Your booking URL</p>
          <code className="text-sm text-primary bg-primary/5 px-2 py-1 rounded">
            {business.slug}.dinaya.lk
          </code>
        </div>

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving}
            className="bg-primary text-primary-foreground px-5 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && <span className="text-green-600 text-sm">Saved ✓</span>}
        </div>
      </form>
    </div>
  );
}
