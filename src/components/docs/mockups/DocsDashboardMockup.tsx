"use client";

import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", active: false },
  { label: "Calendar", active: false },
  { label: "Bookings", active: false },
  { label: "Clients", active: false },
  { label: "Services", active: false },
  { label: "Staff", active: false },
  { label: "Locations", active: false },
  { label: "Availability", active: false },
  { label: "Reviews", active: false },
  { label: "Payments", active: false },
  { label: "Marketing", active: false },
  { label: "AI Hub", active: false },
  { label: "Settings", active: false },
];

type Props = {
  variant: string;
};

export function DocsDashboardMockup({ variant }: Props) {
  const activeNav = (() => {
    if (variant.includes("availability")) return "Availability";
    if (variant.includes("bookings")) return "Bookings";
    if (variant.includes("services")) return "Services";
    if (variant.includes("staff")) return "Staff";
    if (variant.includes("locations")) return "Locations";
    if (variant.includes("marketing")) return "Marketing";
    if (variant.includes("clients")) return "Clients";
    if (variant.includes("calendar")) return "Calendar";
    if (variant.includes("reviews")) return "Reviews";
    if (variant.includes("payments")) return "Payments";
    if (variant.includes("ai")) return "AI Hub";
    if (variant.includes("payhere") || variant.includes("settings") || variant.includes("billing") || variant.includes("integrations") || variant.includes("automations")) return "Settings";
    return "Overview";
  })();

  const title =
    activeNav === "Overview" && variant.includes("onboarding")
      ? "Finish your setup"
      : activeNav;

  return (
    <div className="flex h-full min-h-[220px] text-[10px]">
      <aside className="w-[28%] shrink-0 border-r bg-gray-50/80 p-2">
        <p className="mb-2 px-1 font-cal text-[11px] font-semibold text-gray-900">Dinaya</p>
        <ul className="space-y-0.5">
          {navItems.map((item) => (
            <li
              key={item.label}
              className={cn(
                "rounded px-2 py-1",
                item.label === activeNav
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-gray-500",
              )}
            >
              {item.label}
            </li>
          ))}
        </ul>
      </aside>
      <main className="flex-1 p-3">
        <h3 className="font-cal text-sm font-semibold text-gray-900">{title}</h3>
        {variant.includes("onboarding") && (
          <div className="mt-2 space-y-2">
            {["Business info", "Add a service", "Add staff", "Set availability", "Connect PayHere", "Share link"].map(
              (s, i) => (
                <div
                  key={s}
                  className={cn(
                    "flex items-center justify-between rounded border px-2 py-1.5",
                    i < 2 ? "border-emerald-200 bg-emerald-50/60" : "bg-white",
                  )}
                >
                  <span>{s}</span>
                  <i className={cn("bi", i < 2 ? "bi-check-circle-fill text-emerald-600" : "bi-circle text-gray-300")} />
                </div>
              ),
            )}
          </div>
        )}
        {variant.includes("availability") && (
          <div className="mt-2 space-y-2">
            <div className="rounded border bg-white p-2">
              <p className="font-medium text-gray-800">Weekly hours</p>
              <p className="text-gray-500">Mon–Sat · 9:00 – 18:00</p>
            </div>
            <div className="rounded border border-amber-200 bg-amber-50/50 p-2">
              <p className="font-medium text-amber-800">Blocked dates</p>
              <p className="text-amber-700/80">May 25 – May 27 (Holiday)</p>
            </div>
          </div>
        )}
        {variant.includes("bookings") && (
          <div className="mt-2 rounded border bg-white">
            {["Haircut · May 21, 11:00", "Facial · May 22, 14:00"].map((b) => (
              <div key={b} className="flex justify-between border-b px-2 py-1.5 last:border-0">
                <span>{b}</span>
                <span className="text-emerald-600">Confirmed</span>
              </div>
            ))}
          </div>
        )}
        {variant.includes("services") && (
          <div className="mt-2 space-y-1">
            {["Haircut — Rs. 2,500", "Facial — Rs. 3,800"].map((s) => (
              <div key={s} className="rounded border bg-white px-2 py-1.5">
                {s}
              </div>
            ))}
            <button type="button" className="w-full rounded bg-primary py-1 text-white">
              + Add service
            </button>
          </div>
        )}
        {variant.includes("marketing") && (
          <div className="mt-2 space-y-2">
            <div className="rounded border bg-white p-2">
              <p className="text-gray-500">Your link</p>
              <p className="font-medium text-primary">yourname.dinaya.lk</p>
            </div>
            <div className="flex gap-2">
              <span className="rounded border bg-white px-2 py-1">QR code</span>
              <span className="rounded border bg-white px-2 py-1">WhatsApp</span>
            </div>
          </div>
        )}
        {variant.includes("payhere") && (
          <div className="mt-2 rounded border bg-white p-2">
            <p className="font-medium">PayHere</p>
            <p className="text-gray-500">Merchant ID · Sandbox mode</p>
            <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-amber-800">
              Connect account
            </span>
          </div>
        )}
        {variant.includes("billing") && (
          <div className="mt-2 space-y-2">
            <div className="rounded border bg-white p-2">
              <p className="font-medium">Current plan: Free</p>
              <button type="button" className="mt-2 w-full rounded bg-primary py-1 text-white">
                Upgrade to Pro
              </button>
            </div>
          </div>
        )}
        {variant.includes("integrations") && (
          <div className="mt-2 space-y-1">
            <div className="rounded border bg-white px-2 py-1.5">Google Calendar</div>
            <div className="rounded border bg-white px-2 py-1.5">API keys</div>
            <div className="rounded border bg-white px-2 py-1.5">Webhooks</div>
          </div>
        )}
        {variant.includes("automations") && (
          <div className="mt-2 rounded border bg-white p-2">
            <p className="font-medium">Reminder before visit</p>
            <p className="text-gray-500">Email · 24h before</p>
          </div>
        )}
        {(variant.includes("ai") || variant.includes("clients") || variant.includes("calendar") || variant.includes("overview")) && !variant.includes("onboarding") && (
          <div className="mt-2 h-16 rounded border border-dashed bg-gray-50" />
        )}
      </main>
    </div>
  );
}
