"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Bot,
  BookOpen,
  CalendarDays,
  Clock3,
  CreditCard,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Plug,
  Scissors,
  Settings,
  Star,
  UserRoundCheck,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { useDashboardCopy, useDashboardRole } from "@/components/dashboard/DashboardLocaleProvider";
import type { DashboardCopy } from "@/lib/dashboard-i18n";
import { cn } from "@/lib/utils";

type NavLinkConfig = {
  exact?: boolean;
  href: string;
  icon: LucideIcon;
  labelKey: keyof DashboardCopy["nav"];
  ownerOnly?: boolean;
};

const navGroups: { labelKey: keyof DashboardCopy["navGroups"]; links: NavLinkConfig[] }[] = [
  {
    labelKey: "workspace",
    links: [
      { href: "/dashboard", labelKey: "overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/calendar", labelKey: "calendar", icon: CalendarDays },
      { href: "/dashboard/bookings", labelKey: "bookings", icon: BookOpen },
      { href: "/dashboard/clients", labelKey: "clients", icon: Users },
    ],
  },
  {
    labelKey: "catalog",
    links: [
      { href: "/dashboard/services", labelKey: "services", icon: Scissors, ownerOnly: true },
      { href: "/dashboard/staff", labelKey: "staff", icon: UserRoundCheck, ownerOnly: true },
      { href: "/dashboard/locations", labelKey: "locations", icon: MapPin, ownerOnly: true },
      { href: "/dashboard/availability", labelKey: "availability", icon: Clock3 },
    ],
  },
  {
    labelKey: "growth",
    links: [
      { href: "/dashboard/reviews", labelKey: "reviews", icon: Star, ownerOnly: true },
      { href: "/dashboard/payments", labelKey: "payments", icon: CreditCard, ownerOnly: true },
      { href: "/dashboard/marketing", labelKey: "marketing", icon: Megaphone, ownerOnly: true },
      { href: "/dashboard/ai", labelKey: "aiHub", icon: Bot, ownerOnly: true },
      { href: "/dashboard/reports", labelKey: "reports", icon: BarChart3 },
    ],
  },
  {
    labelKey: "configure",
    links: [
      { href: "/dashboard/settings/integrations", labelKey: "integrations", icon: Plug, ownerOnly: true },
      { href: "/dashboard/automations", labelKey: "automations", icon: Bot, ownerOnly: true },
      { href: "/dashboard/billing", labelKey: "billing", icon: Wallet, ownerOnly: true },
      { href: "/dashboard/settings", labelKey: "settings", icon: Settings, ownerOnly: true },
    ],
  },
];

function NavLink({
  link,
  pathname,
  label,
}: {
  link: NavLinkConfig;
  pathname: string;
  label: string;
}) {
  const Icon = link.icon;
  const isActive = link.exact
    ? pathname === link.href
    : pathname === link.href || pathname.startsWith(`${link.href}/`);

  return (
    <Link
      href={link.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm transition-colors",
        isActive
          ? "border-primary bg-primary/10 font-medium text-primary"
          : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  const copy = useDashboardCopy();
  const role = useDashboardRole();
  const isOwner = role === "owner";

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
      <div className="space-y-5">
        {navGroups.map((group) => {
          const links = group.links.filter((link) => isOwner || !link.ownerOnly);
          if (links.length === 0) return null;

          return (
            <div key={group.labelKey}>
              <p className="mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {copy.navGroups[group.labelKey]}
              </p>
              <div className="space-y-1">
                {links.map((link) => (
                  <NavLink
                    key={link.href}
                    link={link}
                    pathname={pathname}
                    label={copy.nav[link.labelKey]}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </nav>
  );
}
