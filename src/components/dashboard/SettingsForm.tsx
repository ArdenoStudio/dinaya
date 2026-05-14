"use client";

import { useState } from "react";
import type { Business } from "@/db/schema";
import { CheckCircle, CreditCard } from "lucide-react";

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

  const inputCls = "mt-1 w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white";

  return (
    <div className="max-w-lg space-y-5">
      {/* Business info */}
      <form onSubmit={handleSave}>
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Business info</p>
          <div>
            <label className="text-sm font-medium">Business name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className={`${inputCls} resize-none`}
              rows={3}
              placeholder="Tell clients about your business…"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className={inputCls}
              placeholder="+94 77 000 0000"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              className={inputCls}
              placeholder="123 Main St, Colombo 03"
            />
          </div>
          <div className="pt-1">
            <p className="text-xs text-muted-foreground mb-1">Your booking URL</p>
            <code className="text-sm text-primary bg-primary/5 px-2.5 py-1 rounded-md">
              {business.slug}.dinaya.lk
            </code>
          </div>
        </div>

        {/* PayHere */}
        <div className="bg-white border rounded-xl p-6 space-y-4 mt-5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">PayHere</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Accept online payments via{" "}
            <a href="https://www.payhere.lk" target="_blank" rel="noopener noreferrer" className="underline">
              PayHere
            </a>
            . Enter your Merchant ID and Secret from the PayHere dashboard.
          </p>
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.payhereEnabled}
              onChange={(e) => setForm((f) => ({ ...f, payhereEnabled: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm font-medium">Enable PayHere for this business</span>
          </label>
          {form.payhereEnabled && (
            <div className="space-y-3 pl-5 border-l-2 border-primary/20">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Merchant ID</label>
                <input
                  value={form.payhereMerchantId}
                  onChange={(e) => setForm((f) => ({ ...f, payhereMerchantId: e.target.value }))}
                  placeholder="123456"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Merchant Secret</label>
                <input
                  type="password"
                  value={form.payhereMerchantSecret}
                  onChange={(e) => setForm((f) => ({ ...f, payhereMerchantSecret: e.target.value }))}
                  placeholder="••••••••••••••••"
                  className={inputCls}
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-destructive text-sm mt-4">{error}</p>}

        <div className="flex items-center gap-3 mt-5">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-b from-primary/90 to-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium border-b-2 border-primary/70 shadow-sm transition-all hover:shadow-primary/30 hover:shadow-md disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-green-600 text-sm">
              <CheckCircle className="w-4 h-4" /> Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
