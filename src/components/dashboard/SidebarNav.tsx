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
      className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-medium"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`}
    >
      <link.icon className="w-4 h-4 shrink-0" />
      {link.label}
    </Link>
  );
}

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex-1 py-4 px-3 overflow-y-auto">
      <div className="space-y-0.5">
        {mainLinks.map((link) => (
          <NavLink key={link.href} link={link} pathname={pathname} />
        ))}
      </div>
      <div className="my-3 mx-1 border-t border-border/60" />
      <div className="space-y-0.5">
        {systemLinks.map((link) => (
          <NavLink key={link.href} link={link} pathname={pathname} />
        ))}
      </div>
    </nav>
  );
}
