"use client";

import { useEffect, useMemo, useState } from "react";
import {
  groupServicesByCategory,
  isServiceListFiltered,
  paginateServices,
  SERVICE_INITIAL_VISIBLE,
  shouldGroupServicesByCategory,
  shouldUseSearchPagination,
  takeGroupedServicesWindow,
  takeServicesWindow,
  type ServiceCategoryGroup,
  type ServiceFilterable,
} from "@/lib/booking/service-list-filter";

type Options = {
  filteredServices: ServiceFilterable[];
  categories: string[];
  query: string;
  activeCategory: string | null;
  uncategorizedLabel: string;
};

export function useServiceListWindow({
  filteredServices,
  categories,
  query,
  activeCategory,
  uncategorizedLabel,
}: Options) {
  const [visibleCount, setVisibleCount] = useState(SERVICE_INITIAL_VISIBLE);
  const [searchPage, setSearchPage] = useState(1);

  const isFiltered = isServiceListFiltered(query, activeCategory);
  const usePagination = shouldUseSearchPagination(filteredServices.length, query, activeCategory);
  const useGrouping = shouldGroupServicesByCategory(categories, query, activeCategory);

  useEffect(() => {
    setVisibleCount(SERVICE_INITIAL_VISIBLE);
    setSearchPage(1);
  }, [query, activeCategory, filteredServices.length]);

  const presentation = useMemo(() => {
    if (usePagination) {
      const { items, totalPages, page } = paginateServices(filteredServices, searchPage);
      return {
        mode: "paginated" as const,
        flatServices: items,
        groupedServices: null as ServiceCategoryGroup<ServiceFilterable>[] | null,
        hasMore: false,
        remaining: 0,
        searchPage: page,
        totalPages,
      };
    }

    if (useGrouping) {
      const groups = groupServicesByCategory(filteredServices, uncategorizedLabel);
      const windowed = takeGroupedServicesWindow(groups, visibleCount);
      return {
        mode: "grouped" as const,
        flatServices: null as ServiceFilterable[] | null,
        groupedServices: windowed.groups,
        hasMore: windowed.hasMore,
        remaining: windowed.remaining,
        searchPage: 1,
        totalPages: 1,
      };
    }

    const windowed = takeServicesWindow(filteredServices, visibleCount);
    return {
      mode: "flat" as const,
      flatServices: windowed.items,
      groupedServices: null as ServiceCategoryGroup<ServiceFilterable>[] | null,
      hasMore: windowed.hasMore,
      remaining: windowed.remaining,
      searchPage: 1,
      totalPages: 1,
    };
  }, [
    filteredServices,
    searchPage,
    uncategorizedLabel,
    useGrouping,
    usePagination,
    visibleCount,
  ]);

  return {
    ...presentation,
    showMore: presentation.hasMore,
    onShowMore: () => setVisibleCount((count) => count + SERVICE_INITIAL_VISIBLE),
    onSearchPageChange: setSearchPage,
    isFiltered,
    usePagination,
  };
}
