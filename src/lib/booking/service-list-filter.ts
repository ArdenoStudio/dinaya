export const SERVICE_WIZARD_SEARCH_THRESHOLD = 5;
export const SERVICE_INITIAL_VISIBLE = 12;
export const SERVICE_SEARCH_PAGINATION_THRESHOLD = 20;
export const SERVICE_SEARCH_PAGE_SIZE = 20;
export const SERVICE_CATEGORY_GROUP_MIN = 3;
/** @deprecated Use always-on hub search; kept for sticky CTA browse mode threshold */
export const HUB_STICKY_CTA_MAX_SERVICES = 5;
/** @deprecated Use shouldShowServiceSearch with context */
export const SERVICE_SEARCH_THRESHOLD = 8;

export type ServiceFilterable = {
  name: string;
  description?: string | null;
  categoryName?: string | null;
};

export type ServiceCategoryGroup<T extends ServiceFilterable> = {
  category: string;
  services: T[];
};

export function filterServices<T extends ServiceFilterable>(
  services: T[],
  query: string,
  category: string | null,
): T[] {
  const q = query.trim().toLowerCase();
  return services.filter((service) => {
    if (category && service.categoryName !== category) return false;
    if (!q) return true;
    const haystack = `${service.name} ${service.description ?? ""} ${service.categoryName ?? ""}`.toLowerCase();
    return haystack.includes(q);
  });
}

export function uniqueServiceCategories(services: ServiceFilterable[]): string[] {
  const categories = new Set<string>();
  for (const service of services) {
    const name = service.categoryName?.trim();
    if (name) categories.add(name);
  }
  return [...categories].sort((a, b) => a.localeCompare(b));
}

export function shouldShowServiceSearch(
  count: number,
  context: "hub" | "wizard" = "wizard",
): boolean {
  if (context === "hub") return count > 1;
  return count >= SERVICE_WIZARD_SEARCH_THRESHOLD;
}

export function isServiceListFiltered(query: string, category: string | null): boolean {
  return query.trim().length > 0 || category !== null;
}

export function shouldUseSearchPagination(filteredCount: number, query: string, category: string | null): boolean {
  return isServiceListFiltered(query, category) && filteredCount >= SERVICE_SEARCH_PAGINATION_THRESHOLD;
}

export function shouldGroupServicesByCategory(
  categories: string[],
  query: string,
  category: string | null,
): boolean {
  return (
    categories.length >= SERVICE_CATEGORY_GROUP_MIN &&
    !isServiceListFiltered(query, category)
  );
}

export function groupServicesByCategory<T extends ServiceFilterable>(
  services: T[],
  uncategorizedLabel: string,
): ServiceCategoryGroup<T>[] {
  const map = new Map<string, T[]>();
  const uncategorized: T[] = [];

  for (const service of services) {
    const cat = service.categoryName?.trim();
    if (!cat) {
      uncategorized.push(service);
      continue;
    }
    const list = map.get(cat) ?? [];
    list.push(service);
    map.set(cat, list);
  }

  const groups = [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([category, items]) => ({ category, services: items }));

  if (uncategorized.length > 0) {
    groups.push({ category: uncategorizedLabel, services: uncategorized });
  }

  return groups;
}

export function takeServicesWindow<T>(
  services: T[],
  limit: number,
): { items: T[]; hasMore: boolean; remaining: number } {
  const items = services.slice(0, limit);
  return {
    items,
    hasMore: services.length > limit,
    remaining: Math.max(0, services.length - limit),
  };
}

export function takeGroupedServicesWindow<T extends ServiceFilterable>(
  groups: ServiceCategoryGroup<T>[],
  limit: number,
): { groups: ServiceCategoryGroup<T>[]; hasMore: boolean; remaining: number } {
  const result: ServiceCategoryGroup<T>[] = [];
  let shown = 0;

  for (const group of groups) {
    if (shown >= limit) break;
    const remaining = limit - shown;
    if (group.services.length <= remaining) {
      result.push(group);
      shown += group.services.length;
      continue;
    }
    result.push({
      category: group.category,
      services: group.services.slice(0, remaining),
    });
    shown += remaining;
  }

  const total = groups.reduce((sum, group) => sum + group.services.length, 0);
  return {
    groups: result,
    hasMore: total > limit,
    remaining: Math.max(0, total - limit),
  };
}

export function paginateServices<T>(
  services: T[],
  page: number,
  pageSize: number = SERVICE_SEARCH_PAGE_SIZE,
): { items: T[]; totalPages: number; page: number } {
  const totalPages = Math.max(1, Math.ceil(services.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    items: services.slice(start, start + pageSize),
    totalPages,
    page: safePage,
  };
}
