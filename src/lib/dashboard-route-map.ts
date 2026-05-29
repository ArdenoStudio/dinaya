export type DashboardNavGroupKey = "workspace" | "catalog" | "growth" | "configure";

export type DashboardNavLabelKey =
  | "overview"
  | "calendar"
  | "bookings"
  | "clients"
  | "services"
  | "staff"
  | "locations"
  | "availability"
  | "reviews"
  | "payments"
  | "marketing"
  | "deals"
  | "broadcasts"
  | "aiHub"
  | "reports"
  | "integrations"
  | "automations"
  | "billing"
  | "settings";

export type DashboardNativeStatus = "native" | "foundation" | "fallback";

export type DashboardRoute = {
  id: DashboardNavLabelKey;
  desktopApiPath?: `/api/v1/desktop/${string}`;
  desktopPhase: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  exact?: boolean;
  href: string;
  label: string;
  labelKey: DashboardNavLabelKey;
  nativeStatus: DashboardNativeStatus;
  ownerOnly?: boolean;
  summary: string;
};

export type DashboardRouteGroup = {
  id: DashboardNavGroupKey;
  label: string;
  labelKey: DashboardNavGroupKey;
  routes: readonly DashboardRoute[];
};

export const dashboardRouteGroups = [
  {
    id: "workspace",
    label: "Workspace",
    labelKey: "workspace",
    routes: [
      {
        id: "overview",
        label: "Overview",
        labelKey: "overview",
        href: "/dashboard",
        exact: true,
        desktopApiPath: "/api/v1/desktop/overview",
        desktopPhase: 1,
        nativeStatus: "native",
        summary: "Today stats, upcoming bookings, pending actions, activity, and share actions.",
      },
      {
        id: "calendar",
        label: "Calendar",
        labelKey: "calendar",
        href: "/dashboard/calendar",
        desktopApiPath: "/api/v1/desktop/calendar",
        desktopPhase: 2,
        nativeStatus: "native",
        summary: "Day and week views with staff filters, booking previews, and status colors.",
      },
      {
        id: "bookings",
        label: "Bookings",
        labelKey: "bookings",
        href: "/dashboard/bookings",
        desktopApiPath: "/api/v1/desktop/bookings",
        desktopPhase: 2,
        nativeStatus: "native",
        summary: "Today, upcoming, past, cancelled, search, filters, detail, and status actions.",
      },
      {
        id: "clients",
        label: "Clients",
        labelKey: "clients",
        href: "/dashboard/clients",
        desktopApiPath: "/api/v1/desktop/clients",
        desktopPhase: 3,
        nativeStatus: "foundation",
        summary: "Client list, detail, booking history, notes, stages, and contact actions.",
      },
    ],
  },
  {
    id: "catalog",
    label: "Catalog",
    labelKey: "catalog",
    routes: [
      {
        id: "services",
        label: "Services",
        labelKey: "services",
        href: "/dashboard/services",
        desktopApiPath: "/api/v1/desktop/services",
        desktopPhase: 3,
        nativeStatus: "native",
        ownerOnly: true,
        summary: "Service list, detail, pricing, duration, status, and assigned staff.",
      },
      {
        id: "staff",
        label: "Staff",
        labelKey: "staff",
        href: "/dashboard/staff",
        desktopApiPath: "/api/v1/desktop/staff",
        desktopPhase: 3,
        nativeStatus: "native",
        ownerOnly: true,
        summary: "Staff list, role, status, assigned services, and availability summary.",
      },
      {
        id: "locations",
        label: "Locations",
        labelKey: "locations",
        href: "/dashboard/locations",
        desktopApiPath: "/api/v1/desktop/locations",
        desktopPhase: 3,
        nativeStatus: "native",
        ownerOnly: true,
        summary: "Branch list, active status, and booking page coverage.",
      },
      {
        id: "availability",
        label: "Availability",
        labelKey: "availability",
        href: "/dashboard/availability",
        desktopApiPath: "/api/v1/desktop/availability",
        desktopPhase: 3,
        nativeStatus: "foundation",
        summary: "Native weekly window edits, closed-day overrides display, and timezone-aware availability.",
      },
    ],
  },
  {
    id: "growth",
    label: "Growth",
    labelKey: "growth",
    routes: [
      {
        id: "reviews",
        label: "Reviews",
        labelKey: "reviews",
        href: "/dashboard/reviews",
        desktopApiPath: "/api/v1/desktop/reviews",
        desktopPhase: 4,
        nativeStatus: "foundation",
        ownerOnly: true,
        summary: "Review list, native detail, manual replies, visibility, and rating summary.",
      },
      {
        id: "payments",
        label: "Payments",
        labelKey: "payments",
        href: "/dashboard/payments",
        desktopApiPath: "/api/v1/desktop/payments",
        desktopPhase: 4,
        nativeStatus: "foundation",
        ownerOnly: true,
        summary: "Payment list, native booking/payment detail, and status visibility.",
      },
      {
        id: "marketing",
        label: "Marketing",
        labelKey: "marketing",
        href: "/dashboard/marketing",
        desktopApiPath: "/api/v1/desktop/marketing",
        desktopPhase: 4,
        nativeStatus: "foundation",
        ownerOnly: true,
        summary: "Directory, referral, share tools, native content detail, and public-growth settings.",
      },
      {
        id: "deals",
        label: "Deals",
        labelKey: "deals",
        href: "/dashboard/deals",
        desktopApiPath: "/api/v1/desktop/deals",
        desktopPhase: 4,
        nativeStatus: "foundation",
        ownerOnly: true,
        summary: "Deal list, native detail, redemption, expiry, demand-aware suggestions, and performance.",
      },
      {
        id: "broadcasts",
        label: "Broadcasts",
        labelKey: "broadcasts",
        href: "/dashboard/broadcasts",
        desktopApiPath: "/api/v1/desktop/broadcasts",
        desktopPhase: 4,
        nativeStatus: "foundation",
        ownerOnly: true,
        summary: "Broadcast list, native detail, status, audience summary, and result summary.",
      },
      {
        id: "aiHub",
        label: "AI Hub",
        labelKey: "aiHub",
        href: "/dashboard/ai",
        desktopApiPath: "/api/v1/desktop/ai",
        desktopPhase: 4,
        nativeStatus: "foundation",
        ownerOnly: true,
        summary: "Compact launcher plus native workflow-run detail for generated copy, replies, and AI workflows.",
      },
      {
        id: "reports",
        label: "Reports",
        labelKey: "reports",
        href: "/dashboard/reports",
        desktopApiPath: "/api/v1/desktop/reports",
        desktopPhase: 4,
        nativeStatus: "native",
        summary: "Overview metrics, date filters, breakdowns, and CSV export actions.",
      },
    ],
  },
  {
    id: "configure",
    label: "Configure",
    labelKey: "configure",
    routes: [
      {
        id: "integrations",
        label: "Integrations",
        labelKey: "integrations",
        href: "/dashboard/settings/integrations",
        desktopApiPath: "/api/v1/desktop/integrations",
        desktopPhase: 5,
        nativeStatus: "foundation",
        ownerOnly: true,
        summary: "Connected states, native setup detail, and advanced provider setup fallback.",
      },
      {
        id: "automations",
        label: "Automations",
        labelKey: "automations",
        href: "/dashboard/automations",
        desktopApiPath: "/api/v1/desktop/automations",
        desktopPhase: 5,
        nativeStatus: "foundation",
        ownerOnly: true,
        summary: "Automation list, native detail, enable/disable, run status, and history summary.",
      },
      {
        id: "billing",
        label: "Plan & billing",
        labelKey: "billing",
        href: "/dashboard/billing",
        desktopApiPath: "/api/v1/desktop/billing",
        desktopPhase: 5,
        nativeStatus: "native",
        ownerOnly: true,
        summary: "Current plan, usage, and safe web fallback for billing-provider flows.",
      },
      {
        id: "settings",
        label: "Settings",
        labelKey: "settings",
        href: "/dashboard/settings",
        exact: true,
        desktopApiPath: "/api/v1/desktop/settings",
        desktopPhase: 5,
        nativeStatus: "foundation",
        ownerOnly: true,
        summary: "Business profile, desktop device visibility, current-device revoke, and settings fallback.",
      },
    ],
  },
] as const satisfies readonly DashboardRouteGroup[];

export const typedDashboardRouteGroups: readonly DashboardRouteGroup[] = dashboardRouteGroups;

export const dashboardRoutes: readonly DashboardRoute[] = typedDashboardRouteGroups.flatMap((group) => group.routes);

export function findDashboardRoute(id: DashboardNavLabelKey): DashboardRoute | undefined {
  return dashboardRoutes.find((route) => route.id === id);
}
