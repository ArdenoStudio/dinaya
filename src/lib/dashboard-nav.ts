import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarDays,
  Clock3,
  CreditCard,
  LayoutDashboard,
  MapPin,
  Megaphone,
  Plug,
  Radio,
  Scissors,
  Settings,
  Star,
  Tag,
  UserRoundCheck,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type { DashboardCopy } from "@/lib/dashboard-i18n";

export type NavLinkConfig = {
  exact?: boolean;
  href: string;
  icon: LucideIcon;
  labelKey: keyof DashboardCopy["nav"];
  ownerOnly?: boolean;
};

export type NavGroupConfig = {
  labelKey: keyof DashboardCopy["navGroups"];
  links: NavLinkConfig[];
};

export const dashboardNavGroups: NavGroupConfig[] = [
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
      { href: "/dashboard/deals", labelKey: "deals", icon: Tag, ownerOnly: true },
      { href: "/dashboard/broadcasts", labelKey: "broadcasts", icon: Radio, ownerOnly: true },
      { href: "/dashboard/ai", labelKey: "aiHub", icon: Bot, ownerOnly: true },
      { href: "/dashboard/reports", labelKey: "reports", icon: BarChart3 },
    ],
  },
  {
    labelKey: "configure",
    links: [
      { href: "/dashboard/settings/integrations", labelKey: "integrations", icon: Plug, ownerOnly: true },
      { href: "/dashboard/automations", labelKey: "automations", icon: Zap, ownerOnly: true },
      { href: "/dashboard/billing", labelKey: "billing", icon: Wallet, ownerOnly: true },
      { href: "/dashboard/settings", labelKey: "settings", icon: Settings, ownerOnly: true, exact: true },
    ],
  },
];
