"use client";

import Link from "next/link";
import { useState } from "react";
import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  MoreHorizontal,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { trackDashboardNavClick } from "@/lib/analytics/gtag";
import { cn } from "@/lib/utils";

export type BottomNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  routeId?: string;
};

export type MoreNavSection = {
  label: string;
  items: BottomNavItem[];
};

const PRIMARY: BottomNavItem[] = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard, exact: true, routeId: "overview" },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays, routeId: "calendar" },
  { href: "/dashboard/bookings", label: "Bookings", icon: BookOpen, routeId: "bookings" },
  { href: "/dashboard/clients", label: "Clients", icon: Users, routeId: "clients" },
];

function isActive(item: { exact?: boolean; href: string }, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

type DashboardBottomNavProps = {
  activeHref: string;
  moreSections: MoreNavSection[];
  onNavigate?: (href: string) => void;
};

export function DashboardBottomNav({
  activeHref,
  moreSections,
  onNavigate,
}: DashboardBottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreSections.some((section) =>
    section.items.some((item) => isActive(item, activeHref)),
  );

  function handleNav(href: string, surface: "bottom_tab" | "more_sheet", routeId?: string) {
    trackDashboardNavClick({ href, surface, routeId });
    setMoreOpen(false);
    onNavigate?.(href);
  }

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            aria-label="Close more menu"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMoreOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-16 z-50 max-h-[70vh] overflow-y-auto rounded-t-2xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-700 dark:bg-neutral-900">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold">More</p>
              <button
                type="button"
                aria-label="Close"
                className="flex size-11 items-center justify-center rounded-md hover:bg-muted"
                onClick={() => setMoreOpen(false)}
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-4">
              {moreSections.map((section) => (
                <div key={section.label}>
                  <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    {section.label}
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item, activeHref);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => handleNav(item.href, "more_sheet", item.routeId)}
                          className={cn(
                            "flex min-h-12 items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                            active
                              ? "border-primary/40 bg-primary/5 font-medium text-primary"
                              : "border-border text-foreground hover:bg-muted",
                          )}
                        >
                          <Icon className="size-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden dark:border-neutral-800 dark:bg-neutral-950/95"
        aria-label="Primary"
      >
        <div className="grid grid-cols-5">
          {PRIMARY.map((item) => {
            const Icon = item.icon;
            const active = isActive(item, activeHref);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleNav(item.href, "bottom_tab", item.routeId)}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.65rem] font-medium",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[0.65rem] font-medium",
              moreOpen || moreActive ? "text-primary" : "text-muted-foreground",
            )}
            aria-expanded={moreOpen}
          >
            <MoreHorizontal className="size-5" aria-hidden="true" />
            More
          </button>
        </div>
      </nav>
    </>
  );
}

export { PRIMARY as dashboardBottomPrimaryItems };
