"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const mainLinks = [
  { href: "/dashboard", label: "Overview", icon: "bi-grid", exact: true },
  { href: "/dashboard/bookings", label: "Bookings", icon: "bi-book-open" },
  { href: "/dashboard/calendar", label: "Calendar", icon: "bi-calendar" },
  { href: "/dashboard/clients", label: "Clients", icon: "bi-people" },
  { href: "/dashboard/services", label: "Services", icon: "bi-scissors" },
  { href: "/dashboard/staff", label: "Staff", icon: "bi-person-check" },
  { href: "/dashboard/availability", label: "Availability", icon: "bi-clock" },
  { href: "/dashboard/reviews", label: "Reviews", icon: "bi-star" },
];

const systemLinks = [
  { href: "/dashboard/settings", label: "Settings", icon: "bi-gear" },
  { href: "/dashboard/settings/webhooks", label: "Webhooks", icon: "bi-activity" },
];

function NavLink({
  link,
  pathname,
}: {
  link: { href: string; label: string; icon: string; exact?: boolean };
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
      <i className={`bi ${link.icon} text-sm shrink-0`} aria-hidden="true" />
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
