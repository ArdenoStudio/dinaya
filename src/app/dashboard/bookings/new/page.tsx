"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays } from "date-fns";

type Service = { id: string; name: string; durationMinutes: number; priceLkr: number };
type Staff = { id: string; name: string };
type Slot = { startUtc: string; endUtc: string; label: string };

export default function NewBookingPage() {
  const router = useRouter();

  const [services, setServices] = useState<Service[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [slots, setSlots] = useState<Slot[]>([]);

  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [slot, setSlot] = useState<Slot | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Load services on mount
  useEffect(() => {
    fetch("/api/dashboard/services").then((r) => r.json()).then(setServices);
  }, []);

  // Load staff when service changes
  useEffect(() => {
    if (!serviceId) { setStaffList([]); setStaffId(""); return; }
    fetch(`/api/dashboard/services/${serviceId}/staff`)
      .then((r) => r.json())
      .then(setStaffList);
    setStaffId("");
    setSlot(null);
  }, [serviceId]);

  // Load slots when staff + date change
  useEffect(() => {
    if (!staffId || !date || !serviceId) { setSlots([]); return; }
    setLoadingSlots(true);
    setSlot(null);
    fetch(`/api/availability?staffId=${staffId}&date=${date}&serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((data) => { setSlots(data.slots ?? []); setLoadingSlots(false); });
  }, [staffId, date, serviceId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) { setError("Please select a time slot."); return; }
    setSaving(true);
    setError("");

    // Get businessId from session via a light API call
    const sessionRes = await fetch("/api/auth/session");
    const session = await sessionRes.json();
    const businessId = session?.user?.businessId;

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessId,
        serviceId,
        staffId,
        startsAt: slot.startUtc,
        endsAt: slot.endUtc,
        clientName,
        clientPhone,
        clientEmail: clientEmail || null,
        notes: notes || null,
      }),
    });

    const data = await res.json();
    if (!res.ok) { setError(data.error ?? "Something went wrong."); setSaving(false); return; }
    router.push(`/dashboard/bookings/${data.bookingId}`);
  }

  const selectedService = services.find((s) => s.id === serviceId);

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/bookings" className="text-muted-foreground hover:text-foreground text-sm">
          ← Bookings
        </Link>
        <span className="text-muted-foreground">/</span>
        <h1 className="font-cal text-2xl">New booking</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-md px-4 py-2">{error}</div>
        )}

        {/* Step 1: Service */}
        <div className="bg-white border rounded-xl p-5 space-y-4">
          <h2 className="font-medium text-sm">1. Service</h2>
          <div className="grid grid-cols-2 gap-3">
            {services.filter((s) => s).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setServiceId(s.id)}
                className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                  serviceId === s.id ? "border-primary bg-primary/5" : "hover:border-primary/40"
                }`}
              >
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.durationMinutes} min</p>
              </button>
            ))}
            {services.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-2">
                No services yet. <Link href="/dashboard/services/new" className="text-primary hover:underline">Add one first →</Link>
              </p>
            )}
          </div>
        </div>

        {/* Step 2: Staff */}
        {serviceId && (
          <div className="bg-white border rounded-xl p-5 space-y-4">
            <h2 className="font-medium text-sm">2. Staff member</h2>
            <div className="grid grid-cols-2 gap-3">
              {staffList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStaffId(s.id)}
                  className={`text-left p-3 rounded-lg border text-sm transition-colors ${
                    staffId === s.id ? "border-primary bg-primary/5" : "hover:border-primary/40"
                  }`}
                >
                  <p className="font-medium">{s.name}</p>
                </button>
              ))}
              {staffList.length === 0 && (
                <p className="text-sm text-muted-foreground col-span-2">No staff assigned to this service.</p>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Date + Time */}
        {staffId && (
          <div className="bg-white border rounded-xl p-5 space-y-4">
            <h2 className="font-medium text-sm">3. Date & time</h2>
            <div className="flex gap-3 items-center">
              <input
                type="date"
                value={date}
                min={format(new Date(), "yyyy-MM-dd")}
                max={format(addDays(new Date(), 90), "yyyy-MM-dd")}
                onChange={(e) => setDate(e.target.value)}
                className="border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            {loadingSlots ? (
              <p className="text-sm text-muted-foreground">Loading slots…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-muted-foreground">No available slots on this date.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button
                    key={s.startUtc}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                      slot?.startUtc === s.startUtc
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-primary/40"
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Client */}
        {slot && (
          <div className="bg-white border rounded-xl p-5 space-y-4">
            <h2 className="font-medium text-sm">4. Client details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Name *</label>
                <input
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Phone *</label>
                <input
                  required
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Email</label>
                <input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Notes</label>
                <input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </div>
        )}

        {/* Summary + submit */}
        {slot && clientName && clientPhone && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center justify-between">
            <div className="text-sm">
              <p className="font-medium">{selectedService?.name} with {staffList.find((s) => s.id === staffId)?.name}</p>
              <p className="text-muted-foreground">{format(new Date(slot.startUtc), "d MMM yyyy")} at {slot.label}</p>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="bg-primary text-primary-foreground px-6 py-2 rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-60"
            >
              {saving ? "Booking…" : "Confirm booking"}
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
