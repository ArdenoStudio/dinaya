"use client";

import { ThemeProvider } from "next-themes";
import { DashboardLocaleProvider } from "@/components/dashboard/DashboardLocaleProvider";
import {
  DashboardNavigationProvider,
  type DashboardNavigationValue,
} from "@/components/dashboard/DashboardNavigation";
import type { DashboardLanguage } from "@/lib/dashboard-i18n";

type DesktopProvidersProps = {
  children: React.ReactNode;
  language: DashboardLanguage;
  navigation: DashboardNavigationValue;
  role: "owner" | "staff";
};

export function DesktopProviders({ children, language, navigation, role }: DesktopProvidersProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <DashboardLocaleProvider language={language} role={role}>
        <DashboardNavigationProvider value={navigation}>{children}</DashboardNavigationProvider>
      </DashboardLocaleProvider>
    </ThemeProvider>
  );
}
