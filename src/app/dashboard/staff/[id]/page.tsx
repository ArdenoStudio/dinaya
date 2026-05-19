"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Service = { id: string; name: string };

type StaffForm = {
  name: string;
  bio: string;
  avatarUrl: string;
  isActive: boolean;
  serviceIds: string[];
};

export default function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [form, setForm] = useState<StaffForm | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetch(`/api/dashboard/staff/${id}`).then((r) => r.json()),
      fetch("/api/dashboard/services").then((r) => r.json()),
    ]).then(([member, serviceList]) => {
      if (member.error) {
        setForm(null);
      } else {
        setForm({
          name: member.name ?? "",
          bio: member.bio ?? "",
          avatarUrl: member.avatarUrl ?? "",
          isActive: Boolean(member.isActive),
          serviceIds: member.serviceIds ?? [],
        });
      }
      setServices(Array.isArray(serviceList) ? serviceList : []);
      setLoading(false);
    });
  }, [id]);

  function toggleService(serviceId: string) {
    setForm((current) => {
      if (!current) return current;
      return {
        ...current,
        serviceIds: current.serviceIds.includes(serviceId)
          ? current.serviceIds.filter((item) => item !== serviceId)
          : [...current.serviceIds, serviceId],
      };
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");

    const res = await fetch(`/api/dashboard/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        avatarUrl: form.avatarUrl || null,
        bio: form.bio || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not save staff member.");
      setSaving(false);
      return;
    }

    router.push("/dashboard/staff");
  }

  async function handleDelete() {
    setDeleting(true);
    setError("");
    const res = await fetch(`/api/dashboard/staff/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Could not delete staff member.");
      setDeleting(false);
      return;
    }
    router.push("/dashboard/staff");
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;
  if (!form) {
    return (
      <div className="max-w-xl rounded-lg border bg-white p-6">
        <p className="text-sm text-muted-foreground">Staff member not found.</p>
        <Link href="/dashboard/staff" className="mt-4 inline-flex text-sm text-primary hover:underline">
          Back to staff
        </Link>
      </div>
    );
  }

  const inputClass = "mt-1 w-full rounded-md border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="max-w-xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard/staff" className="text-sm text-muted-foreground hover:text-foreground">
            Staff
          </Link>
          <h1 className="font-cal text-2xl">Edit team member</h1>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-md border border-destructive/30 px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/5 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete"}
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-5 rounded-xl border bg-white p-6">
        <div>
          <label className="text-sm font-medium">Name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((current) => current && { ...current, name: e.target.value })}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Short bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm((current) => current && { ...current, bio: e.target.value })}
            className={`${inputClass} resize-none`}
            rows={3}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Avatar URL</label>
          <input
            value={form.avatarUrl}
            onChange={(e) => setForm((current) => current && { ...current, avatarUrl: e.target.value })}
            className={inputClass}
            placeholder="https://..."
          />
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm((current) => current && { ...current, isActive: e.target.checked })}
            className="rounded"
          />
          Active on public booking page
        </label>

        <div>
          <p className="text-sm font-medium">Can perform</p>
          <div className="mt-2 space-y-2">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">No services yet.</p>
            ) : (
              services.map((service) => (
                <label key={service.id} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.serviceIds.includes(service.id)}
                    onChange={() => toggleService(service.id)}
                    className="rounded"
                  />
                  {service.name}
                </label>
              ))
            )}
          </div>
        </div>

        {error && <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button type="button" onClick={() => router.back()} className="text-sm text-muted-foreground hover:text-foreground">
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="ml-auto rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
