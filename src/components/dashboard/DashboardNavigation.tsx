"use client";

import { createContext, useContext } from "react";

export type DashboardNavigationValue = {
  activeHref: string;
  navigate: (href: string) => void;
  signOut?: () => void;
  openExternal?: (href: string) => void;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onSearchSubmit?: () => void;
};

const DashboardNavigationContext = createContext<DashboardNavigationValue | null>(null);

export function DashboardNavigationProvider({
  value,
  children,
}: {
  value: DashboardNavigationValue;
  children: React.ReactNode;
}) {
  return <DashboardNavigationContext.Provider value={value}>{children}</DashboardNavigationContext.Provider>;
}

export function useDashboardNavigationOptional(): DashboardNavigationValue | null {
  return useContext(DashboardNavigationContext);
}

export function useDashboardNavigation(): DashboardNavigationValue {
  const value = useContext(DashboardNavigationContext);
  if (!value) {
    throw new Error("useDashboardNavigation requires DashboardNavigationProvider");
  }
  return value;
}
