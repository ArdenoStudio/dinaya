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
import { dashboardRouteGroups } from "@/lib/dashboard-route-map";
import type { DashboardNavLabelKey } from "@/lib/dashboard-route-map";

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

const routeIcons: Record<DashboardNavLabelKey, LucideIcon> = {
  aiHub: Bot,
  automations: Zap,
  availability: Clock3,
  billing: Wallet,
  bookings: BookOpen,
  broadcasts: Radio,
  calendar: CalendarDays,
  clients: Users,
  deals: Tag,
  integrations: Plug,
  locations: MapPin,
  marketing: Megaphone,
  overview: LayoutDashboard,
  payments: CreditCard,
  reports: BarChart3,
  reviews: Star,
  services: Scissors,
  settings: Settings,
  staff: UserRoundCheck,
};

export const dashboardNavGroups: NavGroupConfig[] = dashboardRouteGroups.map((group) => ({
  labelKey: group.labelKey,
  links: group.routes.map((route) => ({
    exact: route.exact,
    href: route.href,
    icon: routeIcons[route.labelKey],
    labelKey: route.labelKey,
    ownerOnly: route.ownerOnly,
  })),
}));
