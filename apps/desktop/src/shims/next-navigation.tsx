import { useDashboardNavigationOptional } from "@/components/dashboard/DashboardNavigation";

export function usePathname(): string {
  const navigation = useDashboardNavigationOptional();
  return navigation?.activeHref ?? "/dashboard";
}

export function useRouter() {
  const navigation = useDashboardNavigationOptional();
  return {
    push: (href: string) => {
      navigation?.navigate(href);
    },
    replace: (href: string) => {
      navigation?.navigate(href);
    },
  };
}

export function useSearchParams() {
  return new URLSearchParams();
}
