import {
  findDashboardRoute,
  typedDashboardRouteGroups,
  type DashboardNavLabelKey,
  type DashboardRoute,
} from "@/lib/dashboard-route-map";

export function hrefForView(view: DashboardNavLabelKey): string {
  return findDashboardRoute(view)?.href ?? "/dashboard";
}

export function findDashboardRouteByHref(href: string): DashboardRoute | undefined {
  for (const group of typedDashboardRouteGroups) {
    for (const route of group.routes) {
      if (route.exact) {
        if (route.href === href) return route;
      } else if (href === route.href || href.startsWith(`${route.href}/`)) {
        return route;
      }
    }
  }
  return undefined;
}

export function viewForHref(href: string): DashboardNavLabelKey | null {
  return findDashboardRouteByHref(href)?.id ?? null;
}
