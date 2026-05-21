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
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavLinkConfig = {
  exact?: boolean;
  href: string;
  icon: LucideIcon;
  label: string;
};

const navGroups: { label: string; links: NavLinkConfig[] }[] = [
  {
    label: "Workspace",
    links: [
      { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
      { href: "/dashboard/bookings", label: "Bookings", icon: BookOpen },
      { href: "/dashboard/clients", label: "Clients", icon: Users },
    ],
  },
  {
    label: "Catalog",
    links: [
      { href: "/dashboard/services", label: "Services", icon: Scissors },
      { href: "/dashboard/staff", label: "Staff", icon: UserRoundCheck },
      { href: "/dashboard/locations", label: "Locations", icon: MapPin },
      { href: "/dashboard/availability", label: "Availability", icon: Clock3 },
    ],
  },
  {
    label: "Growth",
    links: [
      { href: "/dashboard/reviews", label: "Reviews", icon: Star },
      { href: "/dashboard/payments", label: "Payments", icon: CreditCard },
      { href: "/dashboard/marketing", label: "Marketing", icon: Megaphone },
      { href: "/dashboard/ai", label: "AI Hub", icon: Bot },
      { href: "/dashboard/reports", label: "Reports", icon: BarChart3 },
    ],
  },
  {
    label: "Configure",
    links: [
      { href: "/dashboard/settings/integrations", label: "Integrations", icon: Plug },
      { href: "/dashboard/automations", label: "Automations", icon: Bot },
      { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavLink({ link, pathname }: { link: NavLinkConfig; pathname: string }) {
  const Icon = link.icon;
  const isActive = link.exact
    ? pathname === link.href
    : pathname === link.href || pathname.startsWith(link.href + "/");

  return (
    <Link
      href={link.href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-md border-l-2 px-3 py-2 text-sm transition-colors",
        isActive
          ? "border-primary bg-primary/10 font-medium text-primary"
          : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate">{link.label}</span>
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
      <div className="space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="mb-2 px-3 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground/70">
              {group.label}
            </p>
            <div className="space-y-1">
              {group.links.map((link) => (
                <NavLink key={link.href} link={link} pathname={pathname} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </nav>
  );
}
