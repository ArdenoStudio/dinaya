"use client";

import { cn } from "@/lib/utils";
import { DocsCursor } from "../DocsCursor";
import {
  DASHBOARD_NAV_GROUPS,
  resolveActiveNav,
  type DashboardNavLabel,
} from "./dashboard-nav-layout";

type Props = {
  variant: string;
  highlightNav?: string;
};

function NavHotspot({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute -right-1 top-1/2 z-20 flex -translate-y-1/2 translate-x-1 items-center">
      <DocsCursor className="relative shrink-0" />
      <span className="ml-1 whitespace-nowrap rounded-md bg-gray-900 px-2 py-0.5 text-[9px] font-medium text-white shadow-md">
        {label}
      </span>
    </span>
  );
}

export function DocsDashboardMockup({ variant, highlightNav }: Props) {
  const activeNav = resolveActiveNav(variant);
  const highlight = highlightNav as DashboardNavLabel | undefined;

  const title =
    activeNav === "Overview" && variant.includes("onboarding")
      ? "Finish your setup"
      : activeNav;

  return (
    <div className="flex h-full min-h-[280px] text-[10px]">
      <aside className="relative flex w-[31%] shrink-0 flex-col border-r bg-gray-50/90">
        <div className="border-b px-2.5 py-2">
          <p className="font-cal text-[11px] font-semibold text-gray-900">Dinaya</p>
        </div>
        <nav className="flex-1 overflow-y-auto px-1.5 py-2">
          {DASHBOARD_NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-2.5">
              <p className="mb-1 px-1.5 text-[8px] font-semibold uppercase tracking-wider text-gray-400">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = item === activeNav;
                  const isHighlighted = item === highlight;
                  return (
                    <li key={item} className="relative">
                      <span
                        className={cn(
                          "block rounded-md px-2 py-1 leading-tight",
                          isActive
                            ? "bg-primary/10 font-semibold text-primary"
                            : "text-gray-600",
                          isHighlighted && !isActive && "ring-2 ring-primary/40 ring-offset-1",
                        )}
                      >
                        {item}
                      </span>
                      {isHighlighted ? <NavHotspot label={item} /> : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 overflow-hidden p-3">
        <h3 className="font-cal text-[13px] font-semibold text-gray-900">{title}</h3>

        {variant.includes("onboarding") && (
          <div className="mt-2 space-y-1.5">
            {["Business info", "Add a service", "Add staff", "Set availability", "Connect PayHere", "Share link"].map(
              (s, i) => (
                <div
                  key={s}
                  className={cn(
                    "flex items-center justify-between rounded-md border px-2 py-1.5",
                    i < 2 ? "border-emerald-200 bg-emerald-50/70" : "border-gray-100 bg-white",
                  )}
                >
                  <span>{s}</span>
                  <i
                    className={cn(
                      "bi text-[10px]",
                      i < 2 ? "bi-check-circle-fill text-emerald-600" : "bi-circle text-gray-300",
                    )}
                  />
                </div>
              ),
            )}
          </div>
        )}

        {variant.includes("reviews") && (
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { n: "12", l: "Total" },
                { n: "4.8", l: "Average" },
                { n: "10", l: "Published" },
              ].map((s) => (
                <div key={s.l} className="rounded-lg border bg-white py-2 text-center">
                  <p className="font-cal text-[12px] font-semibold">{s.n}</p>
                  <p className="text-[8px] text-gray-500">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border bg-white p-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900">Dilini Perera</p>
                  <div className="mt-0.5 flex gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <i key={n} className="bi bi-star-fill text-[8px]" />
                    ))}
                  </div>
                  <p className="mt-1 text-[9px] text-gray-500">Great service, will book again!</p>
                </div>
                <span className="h-4 w-7 shrink-0 rounded-full bg-primary" title="Publish toggle" />
              </div>
              <button type="button" className="mt-2 text-[9px] font-medium text-primary">
                Reply
              </button>
              {variant.includes("reviews") && highlight === undefined && (
                <button type="button" className="mt-1 block text-[9px] text-violet-600">
                  Generate reply (Pro)
                </button>
              )}
            </div>
          </div>
        )}

        {variant.includes("availability") && (
          <div className="mt-2 space-y-1.5">
            <div className="rounded-lg border bg-white p-2">
              <p className="font-medium text-gray-800">Weekly hours</p>
              <p className="text-[9px] text-gray-500">Mon–Sat · 9:00 – 18:00</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/60 p-2">
              <p className="font-medium text-amber-900">Blocked dates</p>
              <p className="text-[9px] text-amber-800/90">May 25 – May 27 (Holiday)</p>
            </div>
          </div>
        )}

        {variant.includes("bookings") && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-end">
              <span className="rounded-md bg-primary px-2 py-0.5 text-[9px] font-medium text-white">
                + New booking
              </span>
            </div>
            {["Haircut · May 21, 11:00", "Facial · May 22, 14:00"].map((b) => (
              <div
                key={b}
                className="flex items-center justify-between rounded-lg border bg-white px-2 py-1.5"
              >
                <span>{b}</span>
                <span className="text-[9px] font-medium text-emerald-600">Confirmed</span>
              </div>
            ))}
          </div>
        )}

        {variant.includes("services") && (
          <div className="mt-2 space-y-1">
            {["Haircut — Rs. 2,500", "Facial — Rs. 3,800"].map((s) => (
              <div key={s} className="rounded-lg border bg-white px-2 py-1.5">
                {s}
              </div>
            ))}
            <button type="button" className="w-full rounded-lg bg-primary py-1 text-[9px] font-medium text-white">
              + Add service
            </button>
          </div>
        )}

        {variant.includes("staff") && (
          <div className="mt-2 space-y-1">
            <div className="rounded-lg border bg-white px-2 py-1.5 font-medium">Owner (you)</div>
            <div className="rounded-lg border border-dashed bg-white px-2 py-1.5 text-gray-500">
              + Add staff member
            </div>
          </div>
        )}

        {variant.includes("locations") && (
          <div className="mt-2 space-y-1">
            <div className="rounded-lg border bg-white px-2 py-1.5">
              <p className="font-medium">Main branch</p>
              <p className="text-[9px] text-gray-500">Colombo · Default</p>
            </div>
            <p className="text-[9px] text-amber-700">1 / 1 locations on Free plan</p>
          </div>
        )}

        {variant.includes("clients") && (
          <div className="mt-2 space-y-1">
            {["Anuki Silva", "Ravi Jayawardena"].map((name) => (
              <div key={name} className="flex justify-between rounded-lg border bg-white px-2 py-1.5">
                <span className="font-medium">{name}</span>
                <span className="text-[9px] text-gray-500">3 bookings</span>
              </div>
            ))}
          </div>
        )}

        {variant.includes("calendar") && (
          <div className="mt-2 rounded-lg border bg-white p-2">
            <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] text-gray-400">
              {["M", "T", "W", "T", "F", "S", "S"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>
            <div className="mt-1 space-y-0.5">
              <div className="rounded bg-primary/15 px-1 py-0.5 text-[8px] text-primary">11:00 Haircut</div>
              <div className="rounded bg-primary/10 px-1 py-0.5 text-[8px] text-primary">14:00 Facial</div>
            </div>
          </div>
        )}

        {variant.includes("payments") && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {[
              { n: "Rs. 45,200", l: "This month" },
              { n: "Rs. 3,200", l: "Pending" },
            ].map((s) => (
              <div key={s.l} className="rounded-lg border bg-white p-2">
                <p className="font-cal text-[11px] font-semibold">{s.n}</p>
                <p className="text-[8px] text-gray-500">{s.l}</p>
              </div>
            ))}
          </div>
        )}

        {variant.includes("marketing") && (
          <div className="mt-2 space-y-1.5">
            <div className="rounded-lg border bg-white p-2">
              <p className="text-[9px] text-gray-500">Your booking link</p>
              <p className="font-medium text-primary">yourname.dinaya.lk</p>
            </div>
            <div className="flex flex-wrap gap-1">
              <span className="rounded border bg-white px-1.5 py-0.5">Copy link</span>
              <span className="rounded border bg-white px-1.5 py-0.5">QR code</span>
              <span className="rounded border bg-white px-1.5 py-0.5">WhatsApp</span>
            </div>
            <div className="rounded-lg border border-dashed bg-gray-50 p-2 text-[9px] text-gray-500">
              Directory listing · Embed widget
            </div>
          </div>
        )}

        {variant.includes("ai") && (
          <div className="mt-2 space-y-1">
            {["Booking autopilot", "Smart reminders", "Review engine", "Reactivation"].map((w) => (
              <div key={w} className="flex items-center justify-between rounded-lg border bg-white px-2 py-1">
                <span>{w}</span>
                <span className="rounded-full bg-emerald-100 px-1.5 text-[8px] text-emerald-700">On</span>
              </div>
            ))}
          </div>
        )}

        {variant.includes("reports") && (
          <div className="mt-2 space-y-1.5">
            <div className="h-12 rounded-lg border bg-gradient-to-t from-primary/20 to-white" />
            <p className="text-[9px] text-gray-500">Revenue & bookings · Last 30 days</p>
          </div>
        )}

        {variant.includes("payhere") && (
          <div className="mt-2 rounded-lg border bg-white p-2">
            <p className="font-medium">Payments · PayHere</p>
            <p className="mt-1 text-[9px] text-gray-500">Merchant ID · Sandbox</p>
            <span className="mt-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[9px] text-amber-800">
              Connect account
            </span>
          </div>
        )}

        {variant.includes("billing") && (
          <div className="mt-2 rounded-lg border bg-white p-2">
            <p className="font-medium">Plan: Free</p>
            <button type="button" className="mt-2 w-full rounded-lg bg-primary py-1 text-[9px] font-medium text-white">
              Upgrade to Pro
            </button>
          </div>
        )}

        {variant.includes("integrations") && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center justify-between rounded-lg border bg-white px-2 py-1.5">
              <span>Google Calendar</span>
              <span className="text-[9px] font-medium text-primary">Connect</span>
            </div>
            <div className="rounded-lg border bg-white px-2 py-1.5 text-gray-500">API keys · Webhooks</div>
          </div>
        )}

        {variant.includes("automations") && (
          <div className="mt-2 space-y-1">
            <div className="rounded-lg border bg-white p-2">
              <p className="font-medium">Reminder before visit</p>
              <p className="text-[9px] text-gray-500">Email · 24 hours before</p>
            </div>
            <button type="button" className="text-[9px] font-medium text-primary">
              + Add rule
            </button>
          </div>
        )}

        {variant.includes("settings") && !variant.includes("payhere") && !variant.includes("billing") && (
          <div className="mt-2 space-y-1">
            {["Business profile", "Booking policies", "Account"].map((s) => (
              <div key={s} className="rounded-lg border bg-white px-2 py-1.5">
                {s}
              </div>
            ))}
          </div>
        )}

        {activeNav === "Overview" && !variant.includes("onboarding") && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-lg border bg-white p-2">
              <p className="text-[9px] text-gray-500">Today</p>
              <p className="font-cal text-[12px] font-semibold">4 bookings</p>
            </div>
            <div className="rounded-lg border bg-white p-2">
              <p className="text-[9px] text-gray-500">Revenue</p>
              <p className="font-cal text-[12px] font-semibold">Rs. 8,500</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
