import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from "react";
import { useDashboardNavigationOptional } from "@/components/dashboard/DashboardNavigation";

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  href: string;
  children: ReactNode;
};

function isExternalHref(href: string): boolean {
  return href.startsWith("http://") || href.startsWith("https://") || href.startsWith("mailto:");
}

/** Vite/Tauri shim — web dashboard uses real next/link. */
export default function Link({ href, children, onClick, target, rel, ...props }: LinkProps) {
  const navigation = useDashboardNavigationOptional();

  if (navigation && href.startsWith("/dashboard")) {
    return (
      <a
        href={href}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          event.preventDefault();
          navigation.navigate(href);
          onClick?.(event);
        }}
        target={target}
        rel={rel}
        {...props}
      >
        {children}
      </a>
    );
  }

  if (
    navigation?.openExternal &&
    (isExternalHref(href) || href.startsWith("/docs") || href.startsWith("/admin") || target === "_blank")
  ) {
    return (
      <a
        href={href}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (!event.metaKey && !event.ctrlKey && !event.shiftKey && navigation.openExternal) {
            event.preventDefault();
            navigation.openExternal(href);
          }
          onClick?.(event);
        }}
        target={target}
        rel={rel ?? (target === "_blank" ? "noopener noreferrer" : undefined)}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <a href={href} onClick={onClick} target={target} rel={rel} {...props}>
      {children}
    </a>
  );
}
