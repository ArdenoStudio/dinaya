"use client";

import { createContext, useContext } from "react";
import { getDashboardCopy, type DashboardCopy, type DashboardLanguage } from "@/lib/dashboard-i18n";

type DashboardContextValue = {
  copy: DashboardCopy;
  role: "owner" | "staff";
};

const DashboardContext = createContext<DashboardContextValue>({
  copy: getDashboardCopy("en"),
  role: "owner",
});

export function DashboardLocaleProvider({
  language,
  role,
  children,
}: {
  language: DashboardLanguage;
  role: "owner" | "staff";
  children: React.ReactNode;
}) {
  const copy = getDashboardCopy(language);

  return (
    <DashboardContext.Provider value={{ copy, role }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboardCopy(): DashboardCopy {
  return useContext(DashboardContext).copy;
}

export function useDashboardRole(): "owner" | "staff" {
  return useContext(DashboardContext).role;
}
