"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building2,
  CreditCard,
  Gauge,
  Gift,
  LayoutDashboard,
  LifeBuoy,
  ScrollText,
  Settings,
  ShieldCheck,
  Tags,
  Users,
  Webhook,
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
    label: "Platform",
    links: [
      { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { href: "/admin/accounts", label: "Accounts", icon: Building2 },
      { href: "/admin/users", label: "Users", icon: Users },
    ],
  },
  {
    label: "Revenue",
    links: [
      { href: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
      { href: "/admin/referrals", label: "Referrals", icon: Gift },
      { href: "/admin/plans", label: "Plans", icon: Tags },
    ],
  },
  {
    label: "Operations",
    links: [
      { href: "/admin/activity", label: "Activity log", icon: ScrollText },
      { href: "/admin/health", label: "System health", icon: Gauge },
      { href: "/admin/support", label: "Support", icon: LifeBuoy },
      { href: "/admin/webhooks", label: "Webhooks", icon: Webhook },
    ],
  },
  {
    label: "Configure",
    links: [
      { href: "/admin/settings", label: "Admin settings", icon: Settings },
      { href: "/admin/security", label: "Security", icon: ShieldCheck },
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

export function AdminSidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Platform admin navigation">
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
