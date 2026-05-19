"use client";

import { useState } from "react";

type SettingsBusiness = {
  address: string | null;
  description: string | null;
  facebookUrl: string | null;
  galleryImages: string[] | null;
  instagramUrl: string | null;
  name: string;
  payhereEnabled: boolean;
  payhereMerchantId: string | null;
  payhereMerchantSecret: string | null;
  phone: string | null;
  slug: string;
  timezone: string;
  websiteUrl: string | null;
};

interface Props { business: SettingsBusiness; }

export default function SettingsForm({ business }: Props) {
  const [form, setForm] = useState({
    name: business.name,
    description: business.description ?? "",
    phone: business.phone ?? "",
    address: business.address ?? "",
    timezone: business.timezone,
    instagramUrl: business.instagramUrl ?? "",
    facebookUrl: business.facebookUrl ?? "",
    websiteUrl: business.websiteUrl ?? "",
    payhereEnabled: business.payhereEnabled,
    payhereMerchantId: business.payhereMerchantId ?? "",
    payhereMerchantSecret: business.payhereMerchantSecret ?? "",
  });

  const [galleryImages, setGalleryImages] = useState<string[]>(
    business.galleryImages ?? []
  );
  const [newImageUrl, setNewImageUrl] = useState("");

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
      body: JSON.stringify({ ...form, galleryImages }),
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

  function addGalleryImage() {
    const url = newImageUrl.trim();
    if (!url || galleryImages.includes(url)) return;
    setGalleryImages((prev) => [...prev, url]);
    setNewImageUrl("");
  }

  function removeGalleryImage(url: string) {
    setGalleryImages((prev) => prev.filter((u) => u !== url));
  }

  const inputCls = "mt-1 w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white";

  return (
    <div className="max-w-lg space-y-5">
      <form onSubmit={handleSave} className="space-y-5">
        {/* Business info */}
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
          <div>
            <label className="text-sm font-medium">Timezone</label>
            <select
              value={form.timezone}
              onChange={(e) => setForm((f) => ({ ...f, timezone: e.target.value }))}
              className={inputCls}
            >
              <option value="Asia/Colombo">Asia/Colombo</option>
              <option value="Asia/Kolkata">Asia/Kolkata</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div className="pt-1">
            <p className="text-xs text-muted-foreground mb-1">Your booking URL</p>
            <code className="text-sm text-primary bg-primary/5 px-2.5 py-1 rounded-md">
              {business.slug}.dinaya.lk
            </code>
          </div>
        </div>

        {/* Social links */}
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <i className="bi bi-share text-sm text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Social links</p>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            These appear on your public booking page so clients can find you elsewhere.
          </p>
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5">
              <i className="bi bi-instagram text-pink-500" /> Instagram
            </label>
            <input
              value={form.instagramUrl}
              onChange={(e) => setForm((f) => ({ ...f, instagramUrl: e.target.value }))}
              className={inputCls}
              placeholder="https://instagram.com/yourbusiness"
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5">
              <i className="bi bi-facebook text-blue-600" /> Facebook
            </label>
            <input
              value={form.facebookUrl}
              onChange={(e) => setForm((f) => ({ ...f, facebookUrl: e.target.value }))}
              className={inputCls}
              placeholder="https://facebook.com/yourbusiness"
            />
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-1.5">
              <i className="bi bi-globe text-gray-500" /> Website
            </label>
            <input
              value={form.websiteUrl}
              onChange={(e) => setForm((f) => ({ ...f, websiteUrl: e.target.value }))}
              className={inputCls}
              placeholder="https://yourbusiness.lk"
            />
          </div>
        </div>

        {/* Portfolio gallery */}
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <i className="bi bi-images text-sm text-muted-foreground" />
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Portfolio gallery</p>
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            Add photo URLs to showcase your work on your booking page. Paste a direct image link (ending in .jpg, .png, etc.).
          </p>

          {/* Existing images */}
          {galleryImages.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {galleryImages.map((url) => (
                <div key={url} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(url)}
                    className="absolute top-1 right-1 size-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                  >
                    <i className="bi bi-x" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add image */}
          <div className="flex gap-2">
            <input
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGalleryImage())}
              className="flex-1 border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
              placeholder="https://example.com/photo.jpg"
            />
            <button
              type="button"
              onClick={addGalleryImage}
              disabled={!newImageUrl.trim()}
              className="px-4 py-2.5 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 disabled:opacity-40 transition-colors"
            >
              Add
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            {galleryImages.length}/12 photos · Upload images to a host like{" "}
            <a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="underline">imgbb.com</a> or{" "}
            <a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="underline">imgur.com</a>{" "}
            and paste the direct link here.
          </p>
        </div>

        {/* PayHere */}
        <div className="bg-white border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <i className="bi bi-credit-card text-sm text-muted-foreground" />
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

        {error && <p className="text-destructive text-sm">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-gradient-to-b from-primary/90 to-primary text-primary-foreground px-5 py-2.5 rounded-lg text-sm font-medium border-b-2 border-primary/70 shadow-sm transition-all hover:shadow-primary/30 hover:shadow-md disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-green-600 text-sm">
              <i className="bi bi-check-circle text-sm" /> Saved
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
