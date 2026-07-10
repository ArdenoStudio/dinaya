"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { format, addDays } from "date-fns";
import {
  DashboardField,
  DashboardInput,
} from "@/components/dashboard/DashboardField";
import {
  dashboardInputClass,
  dashboardPrimaryActionClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    fetch("/api/dashboard/services").then((r) => r.json()).then(setServices);
  }, []);

  useEffect(() => {
    if (!serviceId) {
      setStaffList([]);
      setStaffId("");
      return;
    }
    fetch(`/api/dashboard/services/${serviceId}/staff`)
      .then((r) => r.json())
      .then(setStaffList);
    setStaffId("");
    setSlot(null);
  }, [serviceId]);

  useEffect(() => {
    if (!staffId || !date || !serviceId) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    setSlot(null);
    fetch(`/api/availability?staffId=${staffId}&date=${date}&serviceId=${serviceId}`)
      .then((r) => r.json())
      .then((data) => {
        setSlots(data.slots ?? []);
        setLoadingSlots(false);
      });
  }, [staffId, date, serviceId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) {
      setError("Please select a time slot.");
      return;
    }
    setSaving(true);
    setError("");

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
        source: "manual",
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }
    router.push(`/dashboard/bookings/${data.bookingId}`);
  }

  const selectedService = services.find((s) => s.id === serviceId);
  const canConfirm = Boolean(slot && clientName && clientPhone);

  return (
    <div className="max-w-2xl pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <Link
          href="/dashboard/bookings"
          className="inline-flex min-h-11 items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← Bookings
        </Link>
        <h1 className="font-cal text-xl sm:text-2xl">New booking</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="space-y-4 rounded-xl border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
          <h2 className="text-sm font-medium">1. Service</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {services.filter((s) => s).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setServiceId(s.id)}
                className={cn(
                  "min-h-11 rounded-lg border p-3 text-left text-sm transition-colors",
                  serviceId === s.id
                    ? "border-primary bg-primary/5"
                    : "hover:border-primary/40",
                )}
              >
                <p className="font-medium">{s.name}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{s.durationMinutes} min</p>
              </button>
            ))}
            {services.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground">
                No services yet.{" "}
                <Link href="/dashboard/services/new" className="text-primary hover:underline">
                  Add one first →
                </Link>
              </p>
            ) : null}
          </div>
        </div>

        {serviceId ? (
          <div className="space-y-4 rounded-xl border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-medium">2. Staff member</h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {staffList.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStaffId(s.id)}
                  className={cn(
                    "min-h-11 rounded-lg border p-3 text-left text-sm transition-colors",
                    staffId === s.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/40",
                  )}
                >
                  <p className="font-medium">{s.name}</p>
                </button>
              ))}
              {staffList.length === 0 ? (
                <p className="col-span-full text-sm text-muted-foreground">
                  No staff assigned to this service.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {staffId ? (
          <div className="space-y-4 rounded-xl border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-medium">3. Date & time</h2>
            <input
              type="date"
              value={date}
              min={format(new Date(), "yyyy-MM-dd")}
              max={format(addDays(new Date(), 90), "yyyy-MM-dd")}
              onChange={(e) => setDate(e.target.value)}
              className={cn(dashboardInputClass, "mt-0 w-auto min-h-11")}
            />
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
                    className={cn(
                      "min-h-11 rounded-md border px-4 text-sm transition-colors",
                      slot?.startUtc === s.startUtc
                        ? "border-primary bg-primary text-primary-foreground"
                        : "hover:border-primary/40",
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {slot ? (
          <div className="space-y-4 rounded-xl border bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900">
            <h2 className="text-sm font-medium">4. Client details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <DashboardField htmlFor="client-name" label="Name" required>
                <DashboardInput
                  id="client-name"
                  required
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                />
              </DashboardField>
              <DashboardField htmlFor="client-phone" label="Phone" required>
                <DashboardInput
                  id="client-phone"
                  required
                  type="tel"
                  inputMode="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </DashboardField>
              <DashboardField htmlFor="client-email" label="Email" optional>
                <DashboardInput
                  id="client-email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </DashboardField>
              <DashboardField htmlFor="client-notes" label="Notes" optional>
                <DashboardInput
                  id="client-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </DashboardField>
            </div>
          </div>
        ) : null}

        {canConfirm ? (
          <>
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
              <p className="font-medium">
                {selectedService?.name} with {staffList.find((s) => s.id === staffId)?.name}
              </p>
              <p className="text-muted-foreground">
                {format(new Date(slot!.startUtc), "d MMM yyyy")} at {slot!.label}
              </p>
            </div>
            <div className="sticky bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-10 -mx-4 border-t bg-background/95 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
              <button
                type="submit"
                disabled={saving}
                className={cn(dashboardPrimaryActionClass, "w-full justify-center")}
              >
                {saving ? "Booking…" : "Confirm booking"}
              </button>
            </div>
          </>
        ) : null}
      </form>
    </div>
  );
}
