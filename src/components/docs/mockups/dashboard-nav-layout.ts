/** Mirrors dashboardRouteGroups in src/lib/dashboard-route-map.ts */
export const DASHBOARD_NAV_GROUPS = [
  {
    label: "Workspace",
    items: ["Overview", "Calendar", "Bookings", "Clients"],
  },
  {
    label: "Catalog",
    items: ["Services", "Staff", "Locations", "Availability"],
  },
  {
    label: "Growth",
    items: ["Reviews", "Payments", "Marketing", "Deals", "Broadcasts", "AI Hub", "Reports"],
  },
  {
    label: "Configure",
    items: ["Integrations", "Automations", "Plan & billing", "Settings"],
  },
] as const;

export type DashboardNavLabel =
  (typeof DASHBOARD_NAV_GROUPS)[number]["items"][number];

export function resolveActiveNav(variant: string): DashboardNavLabel {
  if (variant.includes("availability")) return "Availability";
  if (variant.includes("bookings")) return "Bookings";
  if (variant.includes("services")) return "Services";
  if (variant.includes("staff")) return "Staff";
  if (variant.includes("locations")) return "Locations";
  if (variant.includes("marketing")) return "Marketing";
  if (variant.includes("deals")) return "Deals";
  if (variant.includes("broadcasts")) return "Broadcasts";
  if (variant.includes("clients")) return "Clients";
  if (variant.includes("calendar")) return "Calendar";
  if (variant.includes("reviews")) return "Reviews";
  if (variant.includes("payments")) return "Payments";
  if (variant.includes("reports")) return "Reports";
  if (variant.includes("ai")) return "AI Hub";
  if (variant.includes("integrations")) return "Integrations";
  if (variant.includes("automations")) return "Automations";
  if (variant.includes("billing")) return "Plan & billing";
  if (variant.includes("overview")) return "Overview";
  if (variant.includes("onboarding")) return "Overview";
  if (variant.includes("payhere") || variant.includes("settings")) {
    return "Settings";
  }
  return "Overview";
}
