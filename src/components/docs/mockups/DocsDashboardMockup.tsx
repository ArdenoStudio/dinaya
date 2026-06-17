"use client";

import { cn } from "@/lib/utils";
import { DocsTargetHighlight } from "../DocsTargetHighlight";
import { DocsCursor } from "../DocsCursor";
import { Icon } from "@/components/ui/Icon";
import {
  DASHBOARD_NAV_GROUPS,
  resolveActiveNav,
  type DashboardNavLabel,
} from "./dashboard-nav-layout";

type Props = {
  variant: string;
  highlightNav?: string;
  highlightTarget?: string;
};

function NavHotspot({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute -right-1 top-1/2 z-20 flex -translate-y-1/2 translate-x-1 items-center">
      <DocsCursor className="relative shrink-0" />
      <span className="ml-1 whitespace-nowrap rounded-md bg-gray-950 px-2 py-0.5 font-cal text-[9px] font-medium text-white shadow-lg">
        {label}
      </span>
    </span>
  );
}

export function DocsDashboardMockup({ variant, highlightNav, highlightTarget }: Props) {
  const activeNav = resolveActiveNav(variant);
  const highlight = highlightNav as DashboardNavLabel | undefined;
  const target = (id: string) => highlightTarget === id;
  const showBookingActions =
    target("bookings-reschedule") || target("bookings-cancel") || target("bookings-refund");

  const title =
    activeNav === "Overview" && variant.includes("onboarding")
      ? "Finish your setup"
      : activeNav;

  return (
    <div className="flex text-[10px]">
      <aside className="relative flex w-[31%] shrink-0 flex-col border-r bg-gray-50 dark:bg-neutral-900/90">
        <div className="border-b px-2.5 py-2">
          <p className="font-cal text-[11px] font-semibold text-gray-900 dark:text-gray-100">Dinaya</p>
        </div>
        <nav className="flex-1 overflow-visible px-1.5 py-2">
          {DASHBOARD_NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-2.5">
              <p className="mb-1 px-1.5 text-[8px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
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
                            : "text-gray-600 dark:text-gray-400",
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
        <h3 className="font-cal text-[13px] font-semibold text-gray-900 dark:text-gray-100">{title}</h3>

        {variant.includes("onboarding") && (
          <div className="mt-2 space-y-1.5">
            {["Business info", "Add a service", "Add staff", "Set availability", "Connect PayHere", "Share link"].map(
              (s, i) => {
                const row = (
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-md border px-2 py-1.5",
                      i < 2 ? "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40" : "border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900",
                    )}
                  >
                    <span>{s}</span>
                    <Icon
                      name={i < 2 ? "check-circle-fill" : "circle"}
                      className={cn(
                        "text-[10px]",
                        i < 2 ? "text-emerald-600" : "text-gray-300",
                      )}
                    />
                  </div>
                );
                if (s === "Business info") {
                  return (
                    <DocsTargetHighlight
                      key={s}
                      active={target("onboarding-business-info")}
                      label="Business info"
                    >
                      {row}
                    </DocsTargetHighlight>
                  );
                }
                return <div key={s}>{row}</div>;
              },
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
                <div key={s.l} className="rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 py-2 text-center">
                  <p className="font-cal text-[12px] font-semibold">{s.n}</p>
                  <p className="text-[8px] text-gray-500 dark:text-gray-400">{s.l}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">Dilini Perera</p>
                  <div className="mt-0.5 flex gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Icon key={n} name="star-fill" className="text-[8px]" />
                    ))}
                  </div>
                  <p className="mt-1 text-[9px] text-gray-500 dark:text-gray-400">Great service, will book again!</p>
                </div>
                <span className="h-4 w-7 shrink-0 rounded-full bg-primary" title="Publish toggle" />
              </div>
              <button type="button" className="mt-2 text-[9px] font-medium text-primary">
                Reply
              </button>
              {variant.includes("reviews") && highlight === undefined && (
                <button type="button" className="mt-1 block text-[9px] text-violet-600">
                  Generate reply (Max)
                </button>
              )}
            </div>
          </div>
        )}

        {variant.includes("availability") && (
          <div className="mt-2 space-y-1.5">
            <DocsTargetHighlight active={target("availability-weekly-hours")} label="Weekly hours">
              <div className="rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-2">
                <p className="font-medium text-gray-800 dark:text-gray-200">Weekly hours</p>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Mon–Sat · 9:00 – 18:00</p>
              </div>
            </DocsTargetHighlight>
            <DocsTargetHighlight active={target("availability-blocked-dates")} label="Blocked dates">
              <div className="rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/35 p-2">
                <p className="font-medium text-amber-900 dark:text-amber-200">Blocked dates</p>
                <p className="text-[9px] text-amber-800/90">May 25 – May 27 (Holiday)</p>
              </div>
            </DocsTargetHighlight>
          </div>
        )}

        {variant.includes("bookings") && (
          <div className="mt-2 space-y-1">
            <div className="flex justify-end">
              <DocsTargetHighlight active={target("bookings-new-booking")} label="New booking" variant="inline">
                <span className="rounded-md bg-primary px-2 py-0.5 text-[9px] font-medium text-white">
                  + New booking
                </span>
              </DocsTargetHighlight>
            </div>
            {["Haircut · May 21, 11:00", "Facial · May 22, 14:00"].map((b, i) => (
              <DocsTargetHighlight
                key={b}
                active={target("bookings-row") && i === 0}
                label="Booking row"
              >
                <div className="flex items-center justify-between rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-2 py-1.5">
                  <span>{b}</span>
                  <span className="text-[9px] font-medium text-emerald-600">Confirmed</span>
                </div>
              </DocsTargetHighlight>
            ))}
            {showBookingActions ? (
              <div className="mt-1.5 rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-2 space-y-1">
                <p className="text-[9px] font-medium text-gray-700 dark:text-gray-300">Haircut · May 21, 11:00</p>
                <div className="flex flex-wrap gap-1">
                  <DocsTargetHighlight active={target("bookings-reschedule")} label="Reschedule" variant="inline">
                    <span className="rounded border px-1.5 py-0.5 text-[9px]">Reschedule</span>
                  </DocsTargetHighlight>
                  <DocsTargetHighlight active={target("bookings-cancel")} label="Cancel" variant="inline">
                    <span className="rounded border border-red-200 px-1.5 py-0.5 text-[9px] text-red-600">
                      Cancel
                    </span>
                  </DocsTargetHighlight>
                  <DocsTargetHighlight active={target("bookings-refund")} label="Refund" variant="inline">
                    <span className="rounded border px-1.5 py-0.5 text-[9px]">Refund</span>
                  </DocsTargetHighlight>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {variant.includes("services") && (
          <div className="mt-2 space-y-1">
            {["Haircut — Rs. 2,500", "Facial — Rs. 3,800"].map((s, i) => (
              <DocsTargetHighlight key={s} active={target("services-row") && i === 0} label="Deposit option">
                <div className="rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-2 py-1.5">{s}</div>
              </DocsTargetHighlight>
            ))}
            <DocsTargetHighlight active={target("services-add-service")} label="+ Add service">
              <button type="button" className="w-full rounded-lg bg-primary py-1 text-[9px] font-medium text-white">
                + Add service
              </button>
            </DocsTargetHighlight>
          </div>
        )}

        {variant.includes("staff") && (
          <div className="mt-2 space-y-1">
            <div className="rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-2 py-1.5 font-medium">Owner (you)</div>
            <div className="rounded-lg border border-dashed bg-white dark:border-neutral-800 dark:bg-neutral-900 px-2 py-1.5 text-gray-500 dark:text-gray-400">
              + Add staff member
            </div>
          </div>
        )}

        {variant.includes("locations") && (
          <div className="mt-2 space-y-1">
            <div className="rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-2 py-1.5">
              <p className="font-medium">Main branch</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400">Colombo · Default</p>
            </div>
            <p className="text-[9px] text-amber-700">1 / 1 locations on Free trial</p>
          </div>
        )}

        {variant.includes("clients") && (
          <div className="mt-2 space-y-1">
            {["Anuki Silva", "Ravi Jayawardena"].map((name) => (
              <div key={name} className="flex justify-between rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-2 py-1.5">
                <span className="font-medium">{name}</span>
                <span className="text-[9px] text-gray-500 dark:text-gray-400">3 bookings</span>
              </div>
            ))}
          </div>
        )}

        {variant.includes("calendar") && (
          <div className="mt-2 rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-2">
            <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] text-gray-400 dark:text-gray-500">
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
              <div key={s.l} className="rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-2">
                <p className="font-cal text-[11px] font-semibold">{s.n}</p>
                <p className="text-[8px] text-gray-500 dark:text-gray-400">{s.l}</p>
              </div>
            ))}
          </div>
        )}

        {variant.includes("marketing") && (
          <div className="mt-2 space-y-1.5">
            <DocsTargetHighlight active={target("marketing-booking-link")} label="Booking link">
              <div className="rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-2">
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Your booking link</p>
                <p className="font-medium text-primary">yourname.dinaya.lk</p>
              </div>
            </DocsTargetHighlight>
            <div className="flex flex-wrap gap-2 pb-1">
              <DocsTargetHighlight active={target("marketing-copy-link")} variant="inline">
                <span className="rounded border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-1.5 py-0.5">Copy link</span>
              </DocsTargetHighlight>
              <DocsTargetHighlight active={target("marketing-qr-code")} label="QR code" variant="inline">
                <span className="rounded border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-1.5 py-0.5">QR code</span>
              </DocsTargetHighlight>
              <DocsTargetHighlight active={target("marketing-whatsapp")} label="WhatsApp share" variant="inline">
                <span className="rounded border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-1.5 py-0.5">WhatsApp</span>
              </DocsTargetHighlight>
            </div>
            <DocsTargetHighlight active={target("marketing-directory")} label="Directory">
              <div className="rounded-lg border border-dashed bg-gray-50 dark:bg-neutral-900/60 p-2 text-[9px] text-gray-500 dark:text-gray-400">
                Directory listing
              </div>
            </DocsTargetHighlight>
            <DocsTargetHighlight active={target("marketing-embed")} label="Embed code">
              <div className="rounded-lg border border-dashed bg-gray-50 dark:bg-neutral-900/60 p-2 text-[9px] text-gray-500 dark:text-gray-400">
                Embed widget · Book now button
              </div>
            </DocsTargetHighlight>
          </div>
        )}

        {variant.includes("ai") && (
          <div className="mt-2 space-y-1">
            {["Booking autopilot", "Smart reminders", "Review engine", "Reactivation"].map((w) => (
              <div key={w} className="flex items-center justify-between rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-2 py-1">
                <span>{w}</span>
                <span className="rounded-full bg-emerald-100 px-1.5 text-[8px] text-emerald-700">On</span>
              </div>
            ))}
          </div>
        )}

        {variant.includes("reports") && (
          <div className="mt-2 space-y-1.5">
            <div className="h-12 rounded-lg border bg-gradient-to-t from-primary/20 to-white" />
            <p className="text-[9px] text-gray-500 dark:text-gray-400">Revenue & bookings · Last 30 days</p>
          </div>
        )}

        {variant.includes("payhere") && (
          <div className="mt-2 rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-2">
            <p className="font-medium">Payments · PayHere</p>
            <p className="mt-1 text-[9px] text-gray-500 dark:text-gray-400">Merchant ID · Sandbox</p>
            <span className="mt-1.5 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[9px] text-amber-800">
              Connect account
            </span>
          </div>
        )}

        {variant.includes("billing") && (
          <div className="mt-2 rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-2">
            <p className="font-medium">Plan: Free trial</p>
            <DocsTargetHighlight active={target("billing-upgrade")} label="Upgrade">
              <button type="button" className="mt-2 w-full rounded-lg bg-primary py-1 text-[9px] font-medium text-white">
                Upgrade to Pro
              </button>
            </DocsTargetHighlight>
          </div>
        )}

        {variant.includes("integrations") && (
          <div className="mt-2 space-y-1">
            <DocsTargetHighlight active={target("integrations-connect")} label="Connect">
              <div className="flex items-center justify-between rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-2 py-1.5">
                <span>Google Calendar</span>
                <span className="text-[9px] font-medium text-primary">Connect</span>
              </div>
            </DocsTargetHighlight>
            <div className="rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-2 py-1.5 text-gray-500 dark:text-gray-400">API keys · Webhooks</div>
          </div>
        )}

        {variant.includes("automations") && (
          <div className="mt-2 space-y-1">
            <div className="rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-2">
              <p className="font-medium">Reminder before visit</p>
              <p className="text-[9px] text-gray-500 dark:text-gray-400">Email · 24 hours before</p>
            </div>
            <button type="button" className="text-[9px] font-medium text-primary">
              + Add rule
            </button>
          </div>
        )}

        {variant.includes("settings") && !variant.includes("payhere") && !variant.includes("billing") && (
          <div className="mt-2 space-y-1">
            {["Business profile", "Booking policies", "Account"].map((s) => (
              <div key={s} className="rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 px-2 py-1.5">
                {s}
              </div>
            ))}
          </div>
        )}

        {activeNav === "Overview" && !variant.includes("onboarding") && (
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            <div className="rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-2">
              <p className="text-[9px] text-gray-500 dark:text-gray-400">Today</p>
              <p className="font-cal text-[12px] font-semibold">4 bookings</p>
            </div>
            <div className="rounded-lg border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-2">
              <p className="text-[9px] text-gray-500 dark:text-gray-400">Revenue</p>
              <p className="font-cal text-[12px] font-semibold">Rs. 8,500</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
