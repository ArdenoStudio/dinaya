"use client";

import { createContext, useContext } from "react";
import { getDashboardCopy, type DashboardCopy, type DashboardLanguage } from "@/lib/dashboard-i18n";

const DashboardLocaleContext = createContext<DashboardCopy>(getDashboardCopy("en"));

export function DashboardLocaleProvider({
  language,
  children,
}: {
  language: DashboardLanguage;
  children: React.ReactNode;
}) {
  const copy = getDashboardCopy(language);

  return (
    <DashboardLocaleContext.Provider value={copy}>
      {children}
    </DashboardLocaleContext.Provider>
  );
}

export function useDashboardCopy(): DashboardCopy {
  return useContext(DashboardLocaleContext);
}
