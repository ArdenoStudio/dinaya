"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  ShieldCheck,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { ConfirmDialog as DashboardConfirmDialog } from "@/components/dashboard/ConfirmDialog";
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

const focusRingClass =
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-neutral-950";

function isActive(item: { exact?: boolean; href: string }, pathname: string): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function getSheetFocusables(sheet: HTMLElement) {
  return Array.from(
    sheet.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => el.tabIndex !== -1 && !el.hasAttribute("disabled"));
}

type DashboardBottomNavProps = {
  activeHref: string;
  moreSections: MoreNavSection[];
  userEmail: string;
  planLabel: string;
  showAdminLink?: boolean;
  onSignOut: () => void;
  onNavigate?: (href: string) => void;
};

export function DashboardBottomNav({
  activeHref,
  moreSections,
  userEmail,
  planLabel,
  showAdminLink = false,
  onSignOut,
  onNavigate,
}: DashboardBottomNavProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const [signOutOpen, setSignOutOpen] = useState(false);
  const sheetId = useId();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const moreTriggerRef = useRef<HTMLButtonElement>(null);
  const sheetRef = useRef<HTMLDivElement>(null);
  const moreActive = moreSections.some((section) =>
    section.items.some((item) => isActive(item, activeHref)),
  );

  useEffect(() => {
    if (!moreOpen) return;

    const scrollY = window.scrollY;
    const previous = {
      overflow: document.body.style.overflow,
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
    };
    const inertTargets = Array.from(
      document.querySelectorAll<HTMLElement>("[data-dashboard-shell-inert]"),
    );
    const navEl = document.querySelector<HTMLElement>("[data-dashboard-bottom-nav]");
    if (navEl) inertTargets.push(navEl);
    for (const el of inertTargets) {
      el.setAttribute("inert", "");
      el.setAttribute("aria-hidden", "true");
    }

    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
    closeRef.current?.focus();
    const triggerEl = moreTriggerRef.current;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMoreOpen(false);
        return;
      }
      if (event.key !== "Tab" || !sheetRef.current) return;
      const focusables = getSheetFocusables(sheetRef.current);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previous.overflow;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      for (const el of inertTargets) {
        el.removeAttribute("inert");
        el.removeAttribute("aria-hidden");
      }
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", onKeyDown);
      triggerEl?.focus();
    };
  }, [moreOpen]);

  function handleNav(href: string, surface: "bottom_tab" | "more_sheet", routeId?: string) {
    trackDashboardNavClick({ href, surface, routeId });
    setMoreOpen(false);
    onNavigate?.(href);
  }

  return (
    <>
      {moreOpen ? (
        <div className="fixed inset-0 z-60 md:hidden" role="presentation">
          <button
            type="button"
            aria-label="Close more menu"
            className="absolute inset-0 bg-black/40 transition-opacity"
            onClick={() => setMoreOpen(false)}
          />
          <div
            ref={sheetRef}
            id={sheetId}
            role="dialog"
            aria-modal="true"
            aria-label="More dashboard pages"
            className="absolute inset-x-0 bottom-0 z-61 flex max-h-[min(85dvh,40rem)] flex-col rounded-t-[1.25rem] border border-neutral-200 bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-8px_40px_rgba(0,0,0,0.12)] dark:border-neutral-700 dark:bg-neutral-950"
          >
            <div className="flex shrink-0 flex-col items-center pt-2">
              <div className="h-1 w-10 rounded-full bg-neutral-300 dark:bg-neutral-600" aria-hidden="true" />
              <div className="flex w-full items-center justify-between px-4 pb-2 pt-3">
                <p id={titleId} className="text-base font-semibold tracking-tight">
                  More
                </p>
                <button
                  ref={closeRef}
                  type="button"
                  aria-label="Close"
                  className={cn(
                    "flex size-11 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 transition-transform active:scale-95 dark:bg-neutral-800 dark:text-neutral-300",
                    focusRingClass,
                  )}
                  onClick={() => setMoreOpen(false)}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-22">
              {moreSections.map((section) => (
                <div key={section.label} className="mb-4">
                  <p className="mb-1.5 px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-neutral-500">
                    {section.label}
                  </p>
                  <ul className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-border/60 dark:bg-card">
                    {section.items.map((item, index) => {
                      const Icon = item.icon;
                      const active = isActive(item, activeHref);
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => handleNav(item.href, "more_sheet", item.routeId)}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex min-h-12 items-center gap-3 px-3.5 py-3 text-[15px] transition-colors active:bg-neutral-200/80 dark:active:bg-neutral-800",
                              focusRingClass,
                              index > 0 && "border-t border-neutral-200/80 dark:border-neutral-800",
                              active
                                ? "bg-primary/6 font-semibold text-primary"
                                : "font-medium text-neutral-900 dark:text-neutral-100",
                            )}
                          >
                            <span
                              className={cn(
                                "flex size-9 shrink-0 items-center justify-center rounded-xl",
                                active
                                  ? "bg-primary/15 text-primary"
                                  : "bg-white text-neutral-600 shadow-xs dark:bg-neutral-800 dark:text-neutral-300",
                              )}
                            >
                              <Icon className="size-4" aria-hidden="true" />
                            </span>
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {active ? (
                              <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true" />
                            ) : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              <div className="mb-2">
                <p className="mb-1.5 px-3 text-[0.7rem] font-semibold uppercase tracking-wider text-neutral-500">
                  Account
                </p>
                <ul className="overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-50 dark:border-border/60 dark:bg-card">
                  <li className="px-3.5 py-3">
                    <p className="truncate text-[15px] font-medium text-neutral-900 dark:text-neutral-100">
                      {userEmail}
                    </p>
                    <p className="mt-0.5 text-xs text-neutral-500">{planLabel}</p>
                  </li>
                  <li className="border-t border-neutral-200/80 dark:border-neutral-800">
                    <Link
                      href="/docs"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(
                        "flex min-h-12 items-center gap-3 px-3.5 py-3 text-[15px] font-medium text-neutral-900 active:bg-neutral-200/80 dark:text-neutral-100 dark:active:bg-neutral-800",
                        focusRingClass,
                      )}
                      onClick={() => setMoreOpen(false)}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-white text-neutral-600 shadow-xs dark:bg-neutral-800 dark:text-neutral-300">
                        <BookOpen className="size-4" aria-hidden="true" />
                      </span>
                      Help &amp; docs
                    </Link>
                  </li>
                  {showAdminLink ? (
                    <li className="border-t border-neutral-200/80 dark:border-neutral-800">
                      <Link
                        href="/admin"
                        className={cn(
                          "flex min-h-12 items-center gap-3 px-3.5 py-3 text-[15px] font-medium text-primary active:bg-neutral-200/80 dark:active:bg-neutral-800",
                          focusRingClass,
                        )}
                        onClick={() => {
                          trackDashboardNavClick({
                            href: "/admin",
                            surface: "more_sheet",
                            routeId: "admin",
                          });
                          setMoreOpen(false);
                        }}
                      >
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          <ShieldCheck className="size-4" aria-hidden="true" />
                        </span>
                        Platform admin
                      </Link>
                    </li>
                  ) : null}
                  <li className="border-t border-neutral-200/80 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => {
                        setMoreOpen(false);
                        setSignOutOpen(true);
                      }}
                      className={cn(
                        "flex min-h-12 w-full items-center gap-3 px-3.5 py-3 text-left text-[15px] font-medium text-red-600 active:bg-neutral-200/80 dark:text-red-400 dark:active:bg-neutral-800",
                        focusRingClass,
                      )}
                    >
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400">
                        <LogOut className="size-4" aria-hidden="true" />
                      </span>
                      Sign out
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <DashboardConfirmDialog
        open={signOutOpen}
        onOpenChange={setSignOutOpen}
        title="Sign out?"
        description="You’ll need to sign in again to manage bookings on this device."
        confirmLabel="Sign out"
        onConfirm={() => {
          onSignOut();
        }}
      />

      <nav
        data-dashboard-bottom-nav
        className="fixed inset-x-0 bottom-0 z-55 border-t border-border/80 bg-[hsl(var(--dashboard-chrome))]/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden"
        aria-label="Primary"
      >
        <div className="grid h-15 grid-cols-5">
          {PRIMARY.map((item) => {
            const Icon = item.icon;
            const active = isActive(item, activeHref);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => handleNav(item.href, "bottom_tab", item.routeId)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-11 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium transition-colors active:scale-[0.96]",
                  focusRingClass,
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                {active ? (
                  <span
                    className="absolute inset-x-4 top-1.5 h-0.5 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                ) : null}
                <Icon className="size-5" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}
          <button
            ref={moreTriggerRef}
            type="button"
            onClick={() => setMoreOpen((open) => !open)}
            className={cn(
              "relative flex min-h-11 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium transition-colors active:scale-[0.96]",
              focusRingClass,
              moreOpen || moreActive ? "text-primary" : "text-muted-foreground",
            )}
            aria-expanded={moreOpen}
            aria-controls={sheetId}
            aria-haspopup="dialog"
            aria-current={moreActive && !moreOpen ? "page" : undefined}
          >
            {moreActive && !moreOpen ? (
              <span
                className="absolute inset-x-4 top-1.5 h-0.5 rounded-full bg-primary"
                aria-hidden="true"
              />
            ) : null}
            <MoreHorizontal
              className="size-5"
              strokeWidth={moreOpen || moreActive ? 2.25 : 1.75}
              aria-hidden="true"
            />
            <span>More</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export { PRIMARY as dashboardBottomPrimaryItems };
