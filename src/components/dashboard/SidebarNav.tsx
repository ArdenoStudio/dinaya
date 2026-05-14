"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  Users,
  Scissors,
  UserCheck,
  Clock,
  Settings,
  Webhook,
} from "lucide-react";

const mainLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/bookings", label: "Bookings", icon: BookOpen },
  { href: "/dashboard/calendar", label: "Calendar", icon: Calendar },
  { href: "/dashboard/clients", label: "Clients", icon: Users },
  { href: "/dashboard/services", label: "Services", icon: Scissors },
  { href: "/dashboard/staff", label: "Staff", icon: UserCheck },
  { href: "/dashboard/availability", label: "Availability", icon: Clock },
];

const systemLinks = [
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/settings/webhooks", label: "Webhooks", icon: Webhook },
];

function NavLink({
  link,
  pathname,
}: {
  link: { href: string; label: string; icon: React.ElementType; exact?: boolean };
  pathname: string;
}) {
  const isActive = link.exact
    ? pathname === link.href
    : pathname === link.href || pathname.startsWith(link.href + "/");
  return (
    <Link
      href={link.href}
      aria-current={isActive ? "page" : undefined}
      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm transition-colors border-l-2 ${
        isActive
          ? "border-primary bg-primary/15 text-primary font-medium"
          : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <link.icon className="w-4 h-4 shrink-0" aria-hidden="true" />
      {link.label}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 py-4 px-3 overflow-y-auto" aria-label="Main navigation">
      <div className="space-y-1">
        {mainLinks.map((link) => (
          <NavLink key={link.href} link={link} pathname={pathname} />
        ))}
      </div>
      <div className="my-3 mx-1 border-t border-border/60" />
      <div className="space-y-1">
        {systemLinks.map((link) => (
          <NavLink key={link.href} link={link} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}
