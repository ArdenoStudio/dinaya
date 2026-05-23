"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { type LucideIcon } from "lucide-react";
import { useDashboardCopy, useDashboardRole } from "@/components/dashboard/DashboardLocaleProvider";
import { dashboardNavGroups } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

function NavLink({
  href,
  exact,
  pathname,
  label,
  icon: Icon,
}: {
  href: string;
  exact?: boolean;
  pathname: string;
  label: string;
  icon: LucideIcon;
}) {
  const isActive = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
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
        {dashboardNavGroups.map((group) => {
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
                    href={link.href}
                    exact={link.exact}
                    pathname={pathname}
                    label={copy.nav[link.labelKey]}
                    icon={link.icon}
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
