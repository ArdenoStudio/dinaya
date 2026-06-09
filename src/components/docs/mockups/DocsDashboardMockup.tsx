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
import { DEMO_CARD, DEMO_NUMERALS, avatarGradient, initials } from "./demo-theme";

type Props = {
  variant: string;
  highlightNav?: string;
  highlightTarget?: string;
};

const NAV_ICONS: Record<DashboardNavLabel, string> = {
  Overview: "grid",
  Calendar: "calendar3",
  Bookings: "calendar2-check",
  Clients: "people",
  Services: "tag",
  Staff: "person-badge",
  Locations: "geo-alt",
  Availability: "clock",
  Reviews: "star",
  Payments: "credit-card",
  Marketing: "send",
  "AI Hub": "stars",
  Reports: "bar-chart-line-fill",
  Integrations: "grid-3x3-gap-fill",
  Automations: "lightning-charge",
  Settings: "gear",
};

const NAV_SUBTITLE: Partial<Record<DashboardNavLabel, string>> = {
  Overview: "Your business at a glance",
  Bookings: "Upcoming and past appointments",
  Services: "Services you offer",
  Staff: "Team members & schedules",
  Locations: "Branches you operate",
  Availability: "Working hours & blocked dates",
  Reviews: "Feedback from your clients",
  Payments: "Revenue & payouts",
  Marketing: "Grow your bookings",
  "AI Hub": "Automations that run for you",
  Reports: "Performance over time",
  Settings: "Profile, policies & account",
};

function Avatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-semibold text-white",
        avatarGradient(name),
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}

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

function StatCard({
  label,
  value,
  trend,
  tone = "primary",
}: {
  label: string;
  value: string;
  trend?: string;
  tone?: "primary" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-600"
      : tone === "amber"
        ? "text-amber-600"
        : "text-primary";
  return (
    <div className={cn(DEMO_CARD, "p-2")}>
      <p className="text-[8px] font-medium uppercase tracking-wide text-gray-400">{label}</p>
      <p className={cn("mt-0.5 font-cal text-[13px] font-semibold text-gray-900", DEMO_NUMERALS)}>
        {value}
      </p>
      {trend ? (
        <p className={cn("mt-0.5 flex items-center gap-0.5 text-[8px] font-medium", toneClass)}>
          <Icon name="graph-up-arrow" className="text-[8px]" />
          {trend}
        </p>
      ) : null}
    </div>
  );
}

export function DocsDashboardMockup({ variant, highlightNav, highlightTarget }: Props) {
  const activeNav = resolveActiveNav(variant);
  const highlight = highlightNav as DashboardNavLabel | undefined;
  const target = (id: string) => highlightTarget === id;
  const showBookingActions =
    target("bookings-reschedule") || target("bookings-cancel") || target("bookings-refund");

  const isOnboarding = activeNav === "Overview" && variant.includes("onboarding");
  const title = isOnboarding ? "Finish your setup" : activeNav;
  const subtitle = isOnboarding
    ? "A few steps to go live"
    : (NAV_SUBTITLE[activeNav] ?? "Manage your workspace");

  return (
    <div className="flex bg-white text-[10.5px] text-gray-700">
      <aside className="relative flex w-[33%] shrink-0 flex-col border-r border-gray-200/70 bg-gradient-to-b from-gray-50/90 to-white">
        <div className="flex items-center gap-1.5 border-b border-gray-200/70 px-2.5 py-2">
          <span className="flex size-5 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-indigo-600 font-cal text-[11px] font-bold text-white shadow-sm">
            D
          </span>
          <p className="font-cal text-[11px] font-semibold text-gray-900">Dinaya</p>
        </div>

        <div className="px-2.5 pt-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/80 px-1.5 py-0.5 text-[8px] font-semibold text-amber-700">
            <Icon name="gem" className="text-[8px]" />
            Free trial
          </span>
        </div>

        <nav className="flex-1 overflow-visible px-1.5 py-2">
          {DASHBOARD_NAV_GROUPS.map((group) => (
            <div key={group.label} className="mb-2">
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
                          "flex items-center gap-1.5 rounded-md px-1.5 py-1 leading-tight transition-colors",
                          isActive
                            ? "bg-primary/10 font-semibold text-primary shadow-[inset_2px_0_0_hsl(var(--primary))]"
                            : "text-gray-600",
                          isHighlighted && !isActive && "ring-2 ring-primary/40 ring-offset-1",
                        )}
                      >
                        <Icon
                          name={NAV_ICONS[item]}
                          className={cn("text-[10px]", isActive ? "text-primary" : "text-gray-400")}
                        />
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

        <div className="mt-auto flex items-center gap-1.5 border-t border-gray-200/70 px-2 py-1.5">
          <Avatar name="Dilini Perera" className="size-5 text-[8px]" />
          <div className="min-w-0">
            <p className="truncate text-[9px] font-semibold text-gray-800">Dilini Perera</p>
            <p className="truncate text-[8px] text-gray-400">Owner</p>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-gray-200/70 px-3 py-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-cal text-[13px] font-semibold text-gray-900">{title}</h3>
            <p className="truncate text-[8px] text-gray-400">{subtitle}</p>
          </div>
          <span className="hidden items-center gap-1 rounded-md border border-gray-200/80 bg-gray-50 px-1.5 py-0.5 text-[8px] text-gray-400 sm:flex">
            <Icon name="search" className="text-[8px]" />
            Search
          </span>
          <span className="relative flex size-5 items-center justify-center rounded-md border border-gray-200/80 bg-white text-gray-400">
            <Icon name="bell" className="text-[9px]" />
            <span className="absolute right-0.5 top-0.5 size-1 rounded-full bg-rose-500" />
          </span>
          <Avatar name="Dilini Perera" className="size-5 text-[8px]" />
        </div>

        <div className="p-3">
          {variant.includes("onboarding") && (
            <div className="space-y-1.5">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[9px] font-medium text-gray-500">2 of 6 complete</p>
                <span className="text-[9px] font-semibold text-primary">33%</span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-gray-100">
                <div className="h-full w-1/3 rounded-full bg-gradient-to-r from-primary to-indigo-500" />
              </div>
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
                      "flex items-center justify-between rounded-lg border px-2 py-1.5",
                      i < 2 ? "border-emerald-200 bg-emerald-50/70" : "border-gray-200/80 bg-white",
                    )}
                  >
                    <span className={cn(i < 2 && "text-emerald-800")}>{s}</span>
                    <Icon
                      name={i < 2 ? "check-circle-fill" : "circle"}
                      className={cn("text-[11px]", i < 2 ? "text-emerald-500" : "text-gray-300")}
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
          )}

          {variant.includes("reviews") && (
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-1.5">
                <StatCard label="Total" value="128" />
                <StatCard label="Average" value="4.8" tone="amber" />
                <StatCard label="Published" value="116" tone="emerald" />
              </div>
              <div className={cn(DEMO_CARD, "p-2")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex gap-1.5">
                    <Avatar name="Dilini Perera" className="size-6 text-[9px]" />
                    <div>
                      <p className="font-semibold text-gray-900">Dilini Perera</p>
                      <div className="mt-0.5 flex gap-0.5 text-amber-400">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <Icon key={n} name="star-fill" className="text-[8px]" />
                        ))}
                      </div>
                      <p className="mt-1 text-[9px] text-gray-500">
                        Great service, will book again!
                      </p>
                    </div>
                  </div>
                  <span
                    className="flex h-3.5 w-6 shrink-0 items-center rounded-full bg-primary px-0.5"
                    title="Publish toggle"
                  >
                    <span className="ml-auto size-2.5 rounded-full bg-white shadow-sm" />
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button type="button" className="text-[9px] font-medium text-primary">
                    Reply
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center gap-0.5 rounded-md bg-violet-50 px-1.5 py-0.5 text-[9px] font-medium text-violet-600"
                  >
                    <Icon name="stars" className="text-[8px]" />
                    Generate reply
                  </button>
                </div>
              </div>
            </div>
          )}

          {variant.includes("availability") && (
            <div className="space-y-1.5">
              <DocsTargetHighlight
                active={target("availability-weekly-hours")}
                label="Weekly hours"
              >
                <div className={cn(DEMO_CARD, "p-2")}>
                  <div className="flex items-center gap-1.5">
                    <Icon name="clock" className="text-[10px] text-primary" />
                    <p className="font-medium text-gray-800">Weekly hours</p>
                  </div>
                  <p className="mt-0.5 text-[9px] text-gray-500">Mon–Sat · 9:00 – 18:00</p>
                </div>
              </DocsTargetHighlight>
              <DocsTargetHighlight
                active={target("availability-blocked-dates")}
                label="Blocked dates"
              >
                <div className="rounded-xl border border-amber-200 bg-amber-50/60 p-2">
                  <div className="flex items-center gap-1.5">
                    <Icon name="calendar-x" className="text-[10px] text-amber-600" />
                    <p className="font-medium text-amber-900">Blocked dates</p>
                  </div>
                  <p className="mt-0.5 text-[9px] text-amber-800/90">May 25 – May 27 (Holiday)</p>
                </div>
              </DocsTargetHighlight>
            </div>
          )}

          {variant.includes("bookings") && (
            <div className="space-y-1.5">
              <div className="flex justify-end">
                <DocsTargetHighlight
                  active={target("bookings-new-booking")}
                  label="New booking"
                  variant="inline"
                >
                  <span className="inline-flex items-center gap-1 rounded-md bg-primary px-2 py-0.5 text-[9px] font-medium text-white shadow-sm">
                    <Icon name="plus" className="text-[9px]" />
                    New booking
                  </span>
                </DocsTargetHighlight>
              </div>
              {[
                { c: "Anuki Silva", s: "Haircut · May 21, 11:00" },
                { c: "Ravi Jayawardena", s: "Facial · May 22, 14:00" },
              ].map((b, i) => (
                <DocsTargetHighlight
                  key={b.s}
                  active={target("bookings-row") && i === 0}
                  label="Booking row"
                >
                  <div className={cn(DEMO_CARD, "flex items-center justify-between px-2 py-1.5")}>
                    <div className="flex items-center gap-1.5">
                      <Avatar name={b.c} className="size-5 text-[8px]" />
                      <div>
                        <p className="font-medium text-gray-900">{b.c}</p>
                        <p className="text-[8px] text-gray-400">{b.s}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8px] font-medium text-emerald-600">
                      Confirmed
                    </span>
                  </div>
                </DocsTargetHighlight>
              ))}
              {showBookingActions ? (
                <div className={cn(DEMO_CARD, "space-y-1 p-2")}>
                  <p className="text-[9px] font-medium text-gray-700">Haircut · May 21, 11:00</p>
                  <div className="flex flex-wrap gap-1">
                    <DocsTargetHighlight
                      active={target("bookings-reschedule")}
                      label="Reschedule"
                      variant="inline"
                    >
                      <span className="rounded-md border border-gray-200 px-1.5 py-0.5 text-[9px]">
                        Reschedule
                      </span>
                    </DocsTargetHighlight>
                    <DocsTargetHighlight
                      active={target("bookings-cancel")}
                      label="Cancel"
                      variant="inline"
                    >
                      <span className="rounded-md border border-red-200 px-1.5 py-0.5 text-[9px] text-red-600">
                        Cancel
                      </span>
                    </DocsTargetHighlight>
                    <DocsTargetHighlight
                      active={target("bookings-refund")}
                      label="Refund"
                      variant="inline"
                    >
                      <span className="rounded-md border border-gray-200 px-1.5 py-0.5 text-[9px]">
                        Refund
                      </span>
                    </DocsTargetHighlight>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {variant.includes("services") && (
            <div className="space-y-1.5">
              {[
                { name: "Haircut", price: "Rs. 2,500", dur: "45 min" },
                { name: "Facial", price: "Rs. 3,800", dur: "60 min" },
              ].map((s, i) => (
                <DocsTargetHighlight
                  key={s.name}
                  active={target("services-row") && i === 0}
                  label="Deposit option"
                >
                  <div className={cn(DEMO_CARD, "flex items-center justify-between px-2 py-1.5")}>
                    <div className="flex items-center gap-1.5">
                      <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <Icon name="scissors" className="text-[9px]" />
                      </span>
                      <div>
                        <p className="font-medium text-gray-900">{s.name}</p>
                        <p className="text-[8px] text-gray-400">{s.dur}</p>
                      </div>
                    </div>
                    <span className={cn("font-semibold text-gray-900", DEMO_NUMERALS)}>
                      {s.price}
                    </span>
                  </div>
                </DocsTargetHighlight>
              ))}
              <DocsTargetHighlight active={target("services-add-service")} label="+ Add service">
                <button
                  type="button"
                  className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-primary py-1.5 text-[9px] font-medium text-white shadow-sm"
                >
                  <Icon name="plus" className="text-[9px]" />
                  Add service
                </button>
              </DocsTargetHighlight>
            </div>
          )}

          {variant.includes("staff") && (
            <div className="space-y-1.5">
              {["Dilini Perera", "Nimal Fernando"].map((name, i) => (
                <div
                  key={name}
                  className={cn(DEMO_CARD, "flex items-center gap-1.5 px-2 py-1.5")}
                >
                  <Avatar name={name} className="size-5 text-[8px]" />
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">{name}</p>
                    <p className="text-[8px] text-gray-400">{i === 0 ? "Owner" : "Stylist"}</p>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-gray-300 bg-white px-2 py-1.5 text-gray-500">
                <Icon name="person-plus" className="text-[9px]" />
                Add staff member
              </div>
            </div>
          )}

          {variant.includes("locations") && (
            <div className="space-y-1.5">
              <div className={cn(DEMO_CARD, "flex items-center gap-1.5 px-2 py-1.5")}>
                <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon name="geo-alt-fill" className="text-[9px]" />
                </span>
                <div>
                  <p className="font-medium text-gray-900">Main branch</p>
                  <p className="text-[8px] text-gray-400">Colombo · Default</p>
                </div>
              </div>
              <p className="flex items-center gap-1 text-[9px] text-amber-700">
                <Icon name="exclamation-circle" className="text-[9px]" />
                1 / 1 locations on Free trial
              </p>
            </div>
          )}

          {variant.includes("clients") && (
            <div className="space-y-1.5">
              {[
                { name: "Anuki Silva", n: "5 bookings" },
                { name: "Ravi Jayawardena", n: "3 bookings" },
                { name: "Tharindu Bandara", n: "2 bookings" },
              ].map((c) => (
                <div
                  key={c.name}
                  className={cn(DEMO_CARD, "flex items-center justify-between px-2 py-1.5")}
                >
                  <div className="flex items-center gap-1.5">
                    <Avatar name={c.name} className="size-5 text-[8px]" />
                    <span className="font-medium text-gray-900">{c.name}</span>
                  </div>
                  <span className="text-[8px] text-gray-400">{c.n}</span>
                </div>
              ))}
            </div>
          )}

          {variant.includes("calendar") && (
            <div className={cn(DEMO_CARD, "p-2")}>
              <div className="grid grid-cols-7 gap-0.5 text-center text-[8px] font-medium text-gray-400">
                {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-0.5">
                {Array.from({ length: 21 }).map((_, i) => (
                  <span
                    key={i}
                    className={cn(
                      "flex h-3.5 items-center justify-center rounded text-[7px] text-gray-400",
                      i === 9 && "bg-primary font-semibold text-white",
                    )}
                  >
                    {i + 1}
                  </span>
                ))}
              </div>
              <div className="mt-1.5 space-y-0.5">
                <div className="rounded bg-primary/15 px-1 py-0.5 text-[8px] font-medium text-primary">
                  11:00 · Haircut — Anuki
                </div>
                <div className="rounded bg-violet-100 px-1 py-0.5 text-[8px] font-medium text-violet-700">
                  14:00 · Facial — Ravi
                </div>
              </div>
            </div>
          )}

          {variant.includes("payments") && (
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <StatCard label="This month" value="Rs. 45,200" trend="+12%" tone="emerald" />
                <StatCard label="Pending" value="Rs. 3,200" tone="amber" />
              </div>
              <div className={cn(DEMO_CARD, "space-y-1 p-2")}>
                {[
                  { c: "Anuki Silva", a: "Rs. 2,500" },
                  { c: "Ravi Jayawardena", a: "Rs. 3,800" },
                ].map((p) => (
                  <div key={p.c} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={p.c} className="size-4 text-[7px]" />
                      <span className="text-[9px] text-gray-600">{p.c}</span>
                    </div>
                    <span className={cn("text-[9px] font-semibold text-gray-900", DEMO_NUMERALS)}>
                      {p.a}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {variant.includes("marketing") && (
            <div className="space-y-1.5">
              <DocsTargetHighlight active={target("marketing-booking-link")} label="Booking link">
                <div className={cn(DEMO_CARD, "p-2")}>
                  <p className="text-[8px] uppercase tracking-wide text-gray-400">
                    Your booking link
                  </p>
                  <div className="mt-0.5 flex items-center gap-1">
                    <Icon name="link-45deg" className="text-[10px] text-primary" />
                    <p className="font-medium text-primary">yourname.dinaya.lk</p>
                  </div>
                </div>
              </DocsTargetHighlight>
              <div className="flex flex-wrap gap-1.5 pb-1">
                <DocsTargetHighlight active={target("marketing-copy-link")} variant="inline">
                  <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-1.5 py-0.5">
                    <Icon name="clipboard" className="text-[8px]" />
                    Copy link
                  </span>
                </DocsTargetHighlight>
                <DocsTargetHighlight
                  active={target("marketing-qr-code")}
                  label="QR code"
                  variant="inline"
                >
                  <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-1.5 py-0.5">
                    <Icon name="grid-3x3-gap-fill" className="text-[8px]" />
                    QR code
                  </span>
                </DocsTargetHighlight>
                <DocsTargetHighlight
                  active={target("marketing-whatsapp")}
                  label="WhatsApp share"
                  variant="inline"
                >
                  <span className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-1.5 py-0.5 text-emerald-600">
                    <Icon name="whatsapp" className="text-[8px]" />
                    WhatsApp
                  </span>
                </DocsTargetHighlight>
              </div>
              <DocsTargetHighlight active={target("marketing-directory")} label="Directory">
                <div className="flex items-center justify-between rounded-lg border border-dashed border-gray-300 bg-gray-50 p-2 text-[9px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Icon name="compass" className="text-[9px]" />
                    Directory listing
                  </span>
                  <span className="flex h-3 w-5 items-center rounded-full bg-primary px-0.5">
                    <span className="ml-auto size-2 rounded-full bg-white" />
                  </span>
                </div>
              </DocsTargetHighlight>
              <DocsTargetHighlight active={target("marketing-embed")} label="Embed code">
                <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-2 text-[9px] text-gray-500">
                  Embed widget · Book now button
                </div>
              </DocsTargetHighlight>
            </div>
          )}

          {variant.includes("ai") && (
            <div className="space-y-1.5">
              {[
                { w: "Booking autopilot", icon: "robot" },
                { w: "Smart reminders", icon: "alarm-fill" },
                { w: "Review engine", icon: "star-fill" },
                { w: "Reactivation", icon: "arrow-counterclockwise" },
              ].map((row) => (
                <div
                  key={row.w}
                  className={cn(DEMO_CARD, "flex items-center justify-between px-2 py-1.5")}
                >
                  <span className="flex items-center gap-1.5">
                    <span className="flex size-5 items-center justify-center rounded-md bg-violet-50 text-violet-600">
                      <Icon name={row.icon} className="text-[9px]" />
                    </span>
                    {row.w}
                  </span>
                  <span className="flex h-3.5 w-6 items-center rounded-full bg-emerald-500 px-0.5">
                    <span className="ml-auto size-2.5 rounded-full bg-white shadow-sm" />
                  </span>
                </div>
              ))}
            </div>
          )}

          {variant.includes("reports") && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <StatCard label="Revenue" value="Rs. 142k" trend="+18%" tone="emerald" />
                <StatCard label="Bookings" value="312" trend="+9%" />
              </div>
              <div className={cn(DEMO_CARD, "p-2")}>
                <div className="flex h-14 items-end gap-1">
                  {[40, 55, 35, 70, 60, 85, 75, 95].map((h, i) => (
                    <span
                      key={i}
                      className="flex-1 rounded-t bg-gradient-to-t from-primary/40 to-primary"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
                <p className="mt-1 text-[8px] text-gray-400">Revenue & bookings · Last 30 days</p>
              </div>
            </div>
          )}

          {variant.includes("payhere") && (
            <div className={cn(DEMO_CARD, "p-2")}>
              <div className="flex items-center gap-1.5">
                <span className="flex size-5 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon name="credit-card-2-front-fill" className="text-[9px]" />
                </span>
                <p className="font-medium text-gray-900">Payments · PayHere</p>
              </div>
              <p className="mt-1 text-[9px] text-gray-500">Merchant ID · Sandbox</p>
              <button
                type="button"
                className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-medium text-amber-800"
              >
                <Icon name="lightning-charge-fill" className="text-[8px]" />
                Connect account
              </button>
            </div>
          )}

          {variant.includes("billing") && (
            <div className={cn(DEMO_CARD, "p-2")}>
              <p className="font-medium text-gray-900">Plan: Free trial</p>
              <p className="text-[9px] text-gray-500">Upgrade to unlock staff, locations & AI.</p>
              <DocsTargetHighlight active={target("billing-upgrade")} label="Upgrade">
                <button
                  type="button"
                  className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-lg bg-gradient-to-r from-primary to-indigo-600 py-1.5 text-[9px] font-medium text-white shadow-sm"
                >
                  <Icon name="rocket-takeoff-fill" className="text-[9px]" />
                  Upgrade to Pro
                </button>
              </DocsTargetHighlight>
            </div>
          )}

          {variant.includes("integrations") && (
            <div className="space-y-1.5">
              <DocsTargetHighlight active={target("integrations-connect")} label="Connect">
                <div className={cn(DEMO_CARD, "flex items-center justify-between px-2 py-1.5")}>
                  <span className="flex items-center gap-1.5">
                    <span className="flex size-5 items-center justify-center rounded-md bg-blue-50 text-blue-500">
                      <Icon name="calendar3" className="text-[9px]" />
                    </span>
                    Google Calendar
                  </span>
                  <span className="rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-medium text-white">
                    Connect
                  </span>
                </div>
              </DocsTargetHighlight>
              <div className={cn(DEMO_CARD, "flex items-center gap-1.5 px-2 py-1.5 text-gray-500")}>
                <Icon name="shield-lock" className="text-[9px]" />
                API keys · Webhooks
              </div>
            </div>
          )}

          {variant.includes("automations") && (
            <div className="space-y-1.5">
              <div className={cn(DEMO_CARD, "p-2")}>
                <div className="flex items-center gap-1.5">
                  <span className="flex size-5 items-center justify-center rounded-md bg-amber-50 text-amber-600">
                    <Icon name="alarm-fill" className="text-[9px]" />
                  </span>
                  <div>
                    <p className="font-medium text-gray-900">Reminder before visit</p>
                    <p className="text-[8px] text-gray-400">Email · 24 hours before</p>
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1 text-[9px] font-medium text-primary"
              >
                <Icon name="plus" className="text-[9px]" />
                Add rule
              </button>
            </div>
          )}

          {variant.includes("settings") &&
            !variant.includes("payhere") &&
            !variant.includes("billing") && (
              <div className="space-y-1.5">
                {[
                  { s: "Business profile", icon: "shop" },
                  { s: "Booking policies", icon: "shield-check" },
                  { s: "Account", icon: "person-circle" },
                ].map((row) => (
                  <div
                    key={row.s}
                    className={cn(DEMO_CARD, "flex items-center justify-between px-2 py-1.5")}
                  >
                    <span className="flex items-center gap-1.5">
                      <Icon name={row.icon} className="text-[10px] text-gray-400" />
                      {row.s}
                    </span>
                    <Icon name="chevron-right" className="text-[9px] text-gray-300" />
                  </div>
                ))}
              </div>
            )}

          {activeNav === "Overview" && !variant.includes("onboarding") && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <StatCard label="Today" value="4 bookings" tone="primary" />
                <StatCard label="Revenue" value="Rs. 8,500" trend="+12%" tone="emerald" />
              </div>
              <div className={cn(DEMO_CARD, "space-y-1 p-2")}>
                <p className="text-[8px] font-medium uppercase tracking-wide text-gray-400">
                  Upcoming
                </p>
                {[
                  { c: "Anuki Silva", t: "11:00" },
                  { c: "Ravi Jayawardena", t: "14:00" },
                ].map((b) => (
                  <div key={b.c} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Avatar name={b.c} className="size-4 text-[7px]" />
                      <span className="text-[9px] text-gray-600">{b.c}</span>
                    </div>
                    <span className={cn("text-[9px] text-gray-400", DEMO_NUMERALS)}>{b.t}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
