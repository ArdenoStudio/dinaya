"use client";

import type { ReactNode } from "react";
import { LogoIcon } from "@/components/Logo";
import { Icon } from "@/components/ui/Icon";
import {
  dashboardCardClass,
  dashboardChromeClass,
  dashboardMainCanvasClass,
  dashboardShellCanvasClass,
} from "@/lib/dashboard-ui";
import { cn } from "@/lib/utils";
import { DocsCursor } from "../DocsCursor";
import { DocsTargetHighlight } from "../DocsTargetHighlight";
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
      <span className="ml-1 whitespace-nowrap rounded-md bg-gray-950/95 px-2 py-0.5 font-cal text-[9px] font-medium text-white shadow-md">
        {label}
      </span>
    </span>
  );
}

function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        dashboardCardClass,
        "shadow-[0_1px_0_rgba(0,0,0,0.03)] dark:shadow-none",
        className,
      )}
    >
      {children}
    </div>
  );
}

function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-2.5 flex items-end justify-between gap-2">
      <div className="min-w-0">
        <h3 className="font-cal text-[13px] font-semibold tracking-tight text-gray-900 dark:text-gray-100">
          {title}
        </h3>
        {subtitle ? (
          <p className="mt-0.5 text-[9px] text-gray-500 dark:text-gray-400">{subtitle}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Surface className="px-2.5 py-2">
      <p className="text-[8px] font-medium uppercase tracking-wide text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p className="mt-0.5 font-cal text-[12px] font-semibold tracking-tight text-gray-900 dark:text-gray-100">
        {value}
      </p>
    </Surface>
  );
}

export function DocsDashboardMockup({ variant, highlightNav, highlightTarget }: Props) {
  const activeNav = resolveActiveNav(variant);
  const highlight = highlightNav as DashboardNavLabel | undefined;
  const target = (id: string) => highlightTarget === id;
  const showBookingActions =
    target("bookings-reschedule") || target("bookings-cancel") || target("bookings-refund");

  const isOnboarding = variant.includes("onboarding");
  const isOverview = activeNav === "Overview" && !isOnboarding;
  const isPayhere = variant.includes("payhere");
  const isBilling = variant.includes("billing");
  const isSettings =
    variant.includes("settings") && !isPayhere && !isBilling && !variant.includes("integrations");

  const title = isOnboarding
    ? "Finish your setup"
    : isPayhere
      ? "Settings"
      : isBilling
        ? "Plan & billing"
        : activeNav;

  return (
    <div className={cn("flex min-h-[320px] text-[10px]", dashboardShellCanvasClass)}>
      <aside className="dashboard-sidebar relative flex w-[34%] shrink-0 flex-col border-r border-black/6 dark:border-white/8">
        <div className="border-b border-black/6 px-2.5 py-2.5 dark:border-white/8">
          <div className="flex items-center gap-1.5 text-gray-900 dark:text-gray-100">
            <LogoIcon className="size-3.5 shrink-0" />
            <div className="min-w-0">
              <p className="truncate font-cal text-[10px] font-semibold leading-none tracking-tight">
                Dilini&apos;s Studio
              </p>
              <p className="mt-0.5 truncate text-[8px] text-gray-500 dark:text-gray-400">Free trial</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-visible px-1.5 py-2">
          {DASHBOARD_NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-2">
              <p className="mb-0.5 px-1.5 text-[8px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                {group.label}
              </p>
              <ul className="space-y-px">
                {group.items.map((item) => {
                  const isActive = item === activeNav;
                  const isHighlighted = item === highlight;
                  return (
                    <li key={item} className="relative">
                      <span
                        className={cn(
                          "block rounded-xl px-2 py-[3px] leading-tight",
                          isActive
                            ? "bg-primary/10 font-medium text-primary"
                            : "font-normal text-gray-700 dark:text-gray-300",
                          isHighlighted &&
                            !isActive &&
                            "ring-2 ring-primary/45 ring-offset-1 ring-offset-[hsl(var(--dashboard-sidebar))]",
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
        <div className="border-t border-black/6 px-2.5 py-2 dark:border-white/8">
          <p className="text-[8px] text-gray-500 dark:text-gray-400">Help & docs</p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header
          className={cn(
            "flex items-center gap-2 border-b px-3 py-1.5",
            dashboardChromeClass,
          )}
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5 rounded-xl border border-black/6 dashboard-main px-2 py-1 dark:border-white/10">
            <Icon name="search" className="text-[9px] text-muted-foreground" />
            <span className="truncate text-[9px] text-muted-foreground">Search · ⌘K</span>
          </div>
          <span className="flex size-5 shrink-0 items-center justify-center rounded-lg bg-muted text-[8px] font-semibold text-muted-foreground">
            D
          </span>
        </header>

        <main className={cn("min-w-0 flex-1 overflow-hidden p-3", dashboardMainCanvasClass)}>
          {!isOverview ? (
            <PageHeader
              title={title}
              subtitle={
                isOnboarding
                  ? "Complete these steps to start taking bookings"
                  : isBilling
                    ? "Manage your plan and usage"
                    : undefined
              }
              action={
                variant.includes("bookings") ? (
                  <DocsTargetHighlight
                    active={target("bookings-new-booking")}
                    label="New booking"
                    variant="inline"
                  >
                    <span className="inline-flex items-center gap-1 rounded-xl bg-primary px-2.5 py-1 text-[9px] font-medium text-white">
                      + New booking
                    </span>
                  </DocsTargetHighlight>
                ) : variant.includes("services") ? (
                  <DocsTargetHighlight
                    active={target("services-add-service")}
                    label="+ Add service"
                    variant="inline"
                  >
                    <span className="inline-flex rounded-xl bg-primary px-2.5 py-1 text-[9px] font-medium text-white">
                      + Add service
                    </span>
                  </DocsTargetHighlight>
                ) : variant.includes("deals") ? (
                  <DocsTargetHighlight
                    active={target("deals-new-deal")}
                    label="New deal"
                    variant="inline"
                  >
                    <span className="inline-flex rounded-xl bg-primary px-2.5 py-1 text-[9px] font-medium text-white">
                      + New deal
                    </span>
                  </DocsTargetHighlight>
                ) : null
              }
            />
          ) : null}

          {isOverview ? (
            <div className="space-y-2.5">
              <div className="flex items-end justify-between gap-2">
                <div>
                  <p className="text-[8px] font-medium uppercase tracking-[0.12em] text-gray-400">
                    Wednesday, May 21
                  </p>
                  <h3 className="mt-1 font-cal text-[16px] font-semibold leading-none tracking-tight text-gray-900 dark:text-gray-100">
                    Good day, Dilini
                  </h3>
                  <p className="mt-1 text-[9px] text-gray-500 dark:text-gray-400">
                    4 appointments today · Rs. 8,500
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-xl bg-primary px-2.5 py-1 text-[9px] font-medium text-white">
                  + New booking
                </span>
              </div>
              <Surface className="overflow-hidden">
                <div className="flex items-center justify-between border-b border-black/6 px-2.5 py-2 dark:border-white/8">
                  <div>
                    <p className="font-cal text-[11px] font-semibold tracking-tight">Today</p>
                    <p className="text-[8px] text-gray-400">Tap an appointment to manage it</p>
                  </div>
                  <span className="text-[9px] font-medium text-primary">Calendar</span>
                </div>
                <div className="space-y-1 p-1.5">
                  {[
                    { time: "11:00", label: "Haircut · Anuki", status: "Confirmed" },
                    { time: "14:00", label: "Facial · Ravi", status: "Confirmed" },
                  ].map((row) => (
                    <div
                      key={row.time}
                      className="flex items-center justify-between rounded-xl px-2 py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-8 font-medium text-gray-500">{row.time}</span>
                        <span className="text-gray-900 dark:text-gray-100">{row.label}</span>
                      </div>
                      <span className="text-[8px] font-medium text-emerald-600">{row.status}</span>
                    </div>
                  ))}
                </div>
              </Surface>
            </div>
          ) : null}

          {isOnboarding ? (
            <div className="space-y-1.5">
              {[
                "Business info",
                "Add a service",
                "Add staff",
                "Set availability",
                "Connect PayHere",
                "Share link",
              ].map((s, i) => {
                const row = (
                  <div
                    className={cn(
                      "flex items-center justify-between rounded-xl border px-2.5 py-1.5",
                      i < 2
                        ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/40"
                        : "border-black/6 bg-white dark:border-white/8 dark:bg-neutral-900",
                    )}
                  >
                    <span className="text-gray-800 dark:text-gray-200">{s}</span>
                    <Icon
                      name={i < 2 ? "check-circle-fill" : "circle"}
                      className={cn("text-[10px]", i < 2 ? "text-emerald-600" : "text-gray-300")}
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
              })}
            </div>
          ) : null}

          {variant.includes("reviews") ? (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                <StatTile label="Total" value="12" />
                <StatTile label="Average" value="4.8" />
                <StatTile label="Published" value="10" />
              </div>
              <Surface className="p-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Dilini Perera</p>
                    <div className="mt-0.5 flex gap-0.5 text-amber-400">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Icon key={n} name="star-fill" className="text-[8px]" />
                      ))}
                    </div>
                    <p className="mt-1 text-[9px] text-gray-500 dark:text-gray-400">
                      Great service, will book again!
                    </p>
                  </div>
                  <span className="h-4 w-7 shrink-0 rounded-md bg-primary" title="Publish toggle" />
                </div>
                <button type="button" className="mt-2 text-[9px] font-medium text-primary">
                  Reply
                </button>
                <button type="button" className="mt-1 block text-[9px] text-muted-foreground">
                  Generate reply (Growth)
                </button>
              </Surface>
            </div>
          ) : null}

          {variant.includes("availability") ? (
            <div className="space-y-1.5">
              <DocsTargetHighlight active={target("availability-weekly-hours")} label="Weekly hours">
                <Surface className="p-2.5">
                  <p className="font-medium text-gray-800 dark:text-gray-200">Weekly hours</p>
                  <p className="text-[9px] text-gray-500 dark:text-gray-400">Mon–Sat · 9:00 – 18:00</p>
                </Surface>
              </DocsTargetHighlight>
              <DocsTargetHighlight active={target("availability-blocked-dates")} label="Blocked dates">
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-2.5 dark:border-amber-800/50 dark:bg-amber-950/35">
                  <p className="font-medium text-amber-900 dark:text-amber-200">Blocked dates</p>
                  <p className="text-[9px] text-amber-800/90">May 25 – May 27 (Holiday)</p>
                </div>
              </DocsTargetHighlight>
            </div>
          ) : null}

          {variant.includes("bookings") ? (
            <div className="space-y-1.5">
              {["Haircut · May 21, 11:00", "Facial · May 22, 14:00"].map((b, i) => (
                <DocsTargetHighlight
                  key={b}
                  active={target("bookings-row") && i === 0}
                  label="Booking row"
                >
                  <Surface className="flex items-center justify-between px-2.5 py-2">
                    <span className="text-gray-900 dark:text-gray-100">{b}</span>
                    <span className="text-[9px] font-medium text-emerald-600">Confirmed</span>
                  </Surface>
                </DocsTargetHighlight>
              ))}
              {showBookingActions ? (
                <Surface className="space-y-1.5 p-2.5">
                  <p className="text-[9px] font-medium text-gray-700 dark:text-gray-300">
                    Haircut · May 21, 11:00
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <DocsTargetHighlight
                      active={target("bookings-reschedule")}
                      label="Reschedule"
                      variant="inline"
                    >
                      <span className="rounded-lg border border-black/8 px-1.5 py-0.5 text-[9px] dark:border-white/10">
                        Reschedule
                      </span>
                    </DocsTargetHighlight>
                    <DocsTargetHighlight
                      active={target("bookings-cancel")}
                      label="Cancel"
                      variant="inline"
                    >
                      <span className="rounded-lg border border-red-200 px-1.5 py-0.5 text-[9px] text-red-600">
                        Cancel
                      </span>
                    </DocsTargetHighlight>
                    <DocsTargetHighlight
                      active={target("bookings-refund")}
                      label="Refund"
                      variant="inline"
                    >
                      <span className="rounded-lg border border-black/8 px-1.5 py-0.5 text-[9px] dark:border-white/10">
                        Refund
                      </span>
                    </DocsTargetHighlight>
                  </div>
                </Surface>
              ) : null}
            </div>
          ) : null}

          {variant.includes("services") ? (
            <div className="space-y-1.5">
              {["Haircut — Rs. 2,500", "Facial — Rs. 3,800"].map((s, i) => (
                <DocsTargetHighlight
                  key={s}
                  active={target("services-row") && i === 0}
                  label="Deposit option"
                >
                  <Surface className="px-2.5 py-2 text-gray-900 dark:text-gray-100">{s}</Surface>
                </DocsTargetHighlight>
              ))}
            </div>
          ) : null}

          {variant.includes("staff") ? (
            <div className="space-y-1.5">
              <Surface className="px-2.5 py-2 font-medium text-gray-900 dark:text-gray-100">
                Owner (you)
              </Surface>
              <div className="rounded-2xl border border-dashed border-black/10 bg-white/70 px-2.5 py-2 text-gray-500 dark:border-white/15 dark:bg-neutral-900/60 dark:text-gray-400">
                + Add staff member
              </div>
            </div>
          ) : null}

          {variant.includes("locations") ? (
            <div className="space-y-1.5">
              <Surface className="px-2.5 py-2">
                <p className="font-medium text-gray-900 dark:text-gray-100">Main branch</p>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">Colombo · Default</p>
              </Surface>
              <p className="text-[9px] text-amber-700 dark:text-amber-400">
                1 / 1 locations on Free trial
              </p>
            </div>
          ) : null}

          {variant.includes("clients") ? (
            <div className="space-y-1.5">
              {["Anuki Silva", "Ravi Jayawardena"].map((name) => (
                <Surface key={name} className="flex justify-between px-2.5 py-2">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{name}</span>
                  <span className="text-[9px] text-gray-500 dark:text-gray-400">3 bookings</span>
                </Surface>
              ))}
            </div>
          ) : null}

          {variant.includes("calendar") ? (
            <Surface className="p-2.5">
              <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] text-gray-400 dark:text-gray-500">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={`${d}-${i}`}>{d}</span>
                ))}
              </div>
              <div className="mt-1.5 space-y-1">
                <div className="rounded-lg bg-primary/15 px-1.5 py-1 text-[8px] font-medium text-primary">
                  11:00 Haircut
                </div>
                <div className="rounded-lg bg-primary/10 px-1.5 py-1 text-[8px] font-medium text-primary">
                  14:00 Facial
                </div>
              </div>
            </Surface>
          ) : null}

          {variant.includes("payments") ? (
            <div className="grid grid-cols-2 gap-1.5">
              <StatTile label="This month" value="Rs. 45,200" />
              <StatTile label="Pending" value="Rs. 3,200" />
            </div>
          ) : null}

          {variant.includes("marketing") ? (
            <div className="space-y-1.5">
              <DocsTargetHighlight active={target("marketing-booking-link")} label="Booking link">
                <Surface className="p-2.5">
                  <p className="text-[9px] text-gray-500 dark:text-gray-400">Your booking link</p>
                  <p className="font-medium text-primary">dilini.dinaya.lk</p>
                </Surface>
              </DocsTargetHighlight>
              <div className="flex flex-wrap gap-1.5 pb-0.5">
                <DocsTargetHighlight active={target("marketing-copy-link")} variant="inline">
                  <span className="rounded-lg border border-black/8 bg-white px-1.5 py-0.5 dark:border-white/10 dark:bg-neutral-900">
                    Copy link
                  </span>
                </DocsTargetHighlight>
                <DocsTargetHighlight
                  active={target("marketing-qr-code")}
                  label="QR code"
                  variant="inline"
                >
                  <span className="rounded-lg border border-black/8 bg-white px-1.5 py-0.5 dark:border-white/10 dark:bg-neutral-900">
                    QR code
                  </span>
                </DocsTargetHighlight>
                <DocsTargetHighlight
                  active={target("marketing-whatsapp")}
                  label="WhatsApp share"
                  variant="inline"
                >
                  <span className="rounded-lg border border-black/8 bg-white px-1.5 py-0.5 dark:border-white/10 dark:bg-neutral-900">
                    WhatsApp
                  </span>
                </DocsTargetHighlight>
              </div>
              <DocsTargetHighlight active={target("marketing-directory")} label="Directory">
                <div className="rounded-2xl border border-dashed border-black/10 bg-white/70 p-2.5 text-[9px] text-gray-500 dark:border-white/15 dark:bg-neutral-900/60 dark:text-gray-400">
                  Directory listing
                </div>
              </DocsTargetHighlight>
              <DocsTargetHighlight active={target("marketing-embed")} label="Embed code">
                <div className="rounded-2xl border border-dashed border-black/10 bg-white/70 p-2.5 text-[9px] text-gray-500 dark:border-white/15 dark:bg-neutral-900/60 dark:text-gray-400">
                  Embed widget · Book now button
                </div>
              </DocsTargetHighlight>
            </div>
          ) : null}

          {variant.includes("deals") ? (
            <div className="space-y-1.5">
              <DocsTargetHighlight active={target("deals-row")} label="Deal">
                <Surface className="p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        Midweek Haircut
                      </p>
                      <p className="text-[9px] text-gray-500 dark:text-gray-400">
                        30% off · 8 slots left
                      </p>
                    </div>
                    <span className="rounded-md bg-emerald-100 px-1.5 py-0.5 text-[8px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      Live
                    </span>
                  </div>
                </Surface>
              </DocsTargetHighlight>
              <Surface className="p-2.5">
                <p className="font-medium text-gray-900 dark:text-gray-100">Quiet Tuesday Facial</p>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">
                  20% off · Ends May 28
                </p>
              </Surface>
            </div>
          ) : null}

          {variant.includes("ai") ? (
            <div className="space-y-1.5">
              {["Booking autopilot", "Smart reminders", "Review engine", "Reactivation"].map(
                (w) => (
                  <Surface
                    key={w}
                    className="flex items-center justify-between px-2.5 py-1.5"
                  >
                    <span className="text-gray-900 dark:text-gray-100">{w}</span>
                    <span className="rounded-md bg-emerald-100 px-1.5 text-[8px] font-medium text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                      On
                    </span>
                  </Surface>
                ),
              )}
            </div>
          ) : null}

          {variant.includes("reports") ? (
            <Surface className="space-y-1.5 p-2.5">
              <div className="h-14 rounded-xl bg-linear-to-t from-primary/20 via-primary/5 to-transparent" />
              <p className="text-[9px] text-gray-500 dark:text-gray-400">
                Revenue & bookings · Last 30 days
              </p>
            </Surface>
          ) : null}

          {isPayhere ? (
            <Surface className="p-2.5">
              <p className="font-medium text-gray-900 dark:text-gray-100">Payments · PayHere</p>
              <p className="mt-1 text-[9px] text-gray-500 dark:text-gray-400">
                Merchant ID · Sandbox
              </p>
              <span className="mt-2 inline-block rounded-lg bg-amber-100 px-2 py-0.5 text-[9px] font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                Connect account
              </span>
            </Surface>
          ) : null}

          {isBilling ? (
            <Surface className="p-2.5">
              <p className="font-medium text-gray-900 dark:text-gray-100">Plan: Free trial</p>
              <p className="mt-0.5 text-[9px] text-gray-500 dark:text-gray-400">
                Upgrade for AI, multi-staff, and custom domains
              </p>
              <DocsTargetHighlight active={target("billing-upgrade")} label="Upgrade">
                <button
                  type="button"
                  className="mt-2 w-full rounded-xl bg-primary py-1.5 text-[9px] font-medium text-white"
                >
                  Upgrade to Pro
                </button>
              </DocsTargetHighlight>
            </Surface>
          ) : null}

          {variant.includes("integrations") ? (
            <div className="space-y-1.5">
              <DocsTargetHighlight active={target("integrations-connect")} label="Connect">
                <Surface className="flex items-center justify-between px-2.5 py-2">
                  <span className="text-gray-900 dark:text-gray-100">Google Calendar</span>
                  <span className="text-[9px] font-medium text-primary">Connect</span>
                </Surface>
              </DocsTargetHighlight>
              <Surface className="px-2.5 py-2 text-gray-500 dark:text-gray-400">
                API keys · Webhooks
              </Surface>
            </div>
          ) : null}

          {variant.includes("automations") ? (
            <div className="space-y-1.5">
              <Surface className="p-2.5">
                <p className="font-medium text-gray-900 dark:text-gray-100">Reminder before visit</p>
                <p className="text-[9px] text-gray-500 dark:text-gray-400">
                  Email · 24 hours before
                </p>
              </Surface>
              <button type="button" className="text-[9px] font-medium text-primary">
                + Add rule
              </button>
            </div>
          ) : null}

          {isSettings ? (
            <div className="space-y-1.5">
              {["Business profile", "Booking policies", "Account"].map((s) => (
                <Surface key={s} className="px-2.5 py-2 text-gray-900 dark:text-gray-100">
                  {s}
                </Surface>
              ))}
            </div>
          ) : null}
        </main>
      </div>
    </div>
  );
}
