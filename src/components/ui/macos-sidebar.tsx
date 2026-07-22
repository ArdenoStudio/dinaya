"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SidebarToggleIcon } from "@/components/unlumen-ui/sidebar-toggle-icon";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";

export interface MacOSSidebarItem {
  label: string;
  href: string;
  icon?: ReactNode;
  exact?: boolean;
}

export interface MacOSSidebarSection {
  label?: string;
  items: MacOSSidebarItem[];
}

export interface MacOSSidebarProps {
  sections: MacOSSidebarSection[];
  activeHref: string;
  defaultOpen?: boolean;
  children?: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  collapsedFooter?: ReactNode;
  onNavigate?: () => void;
  /** When set, nav items render as buttons instead of Next.js links (desktop app). */
  onItemSelect?: (href: string) => void;
}

function isItemActive(item: MacOSSidebarItem, activeHref: string): boolean {
  if (item.exact) {
    return activeHref === item.href;
  }
  return activeHref === item.href || activeHref.startsWith(`${item.href}/`);
}

function SidebarNavLink({
  item,
  active,
  className,
  onNavigate,
  onItemSelect,
  children,
  collapsed = false,
}: {
  item: MacOSSidebarItem;
  active: boolean;
  className: string;
  onNavigate?: () => void;
  onItemSelect?: (href: string) => void;
  children: ReactNode;
  collapsed?: boolean;
}) {
  const labelProps = collapsed
    ? { "aria-label": item.label, title: item.label }
    : {};

  if (onItemSelect) {
    return (
      <button
        type="button"
        aria-current={active ? "page" : undefined}
        onClick={() => {
          onItemSelect(item.href);
          onNavigate?.();
        }}
        className={className}
        {...labelProps}
      >
        {children}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={className}
      {...labelProps}
    >
      {children}
    </Link>
  );
}

export function MacOSSidebar({
  sections,
  activeHref,
  defaultOpen = true,
  children,
  className,
  header,
  footer,
  collapsedFooter,
  onNavigate,
  onItemSelect,
}: MacOSSidebarProps) {
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const reducedMotion = useReducedMotion();
  const sidebarTransition = reducedMotion
    ? { duration: 0 }
    : { type: "spring" as const, bounce: 0.15, duration: 0.35 };

  return (
    <div
      className={cn(
        "dashboard-canvas relative flex w-full overflow-hidden",
        className,
      )}
    >
      <motion.aside
        animate={{ width: isOpen ? 248 : 64 }}
        transition={sidebarTransition}
        className={cn(
          "hidden shrink-0 flex-col items-start border-r border-black/[0.06] p-2 transition-colors duration-300 ease-out md:flex md:h-full md:max-h-full dark:border-white/[0.08]",
          isOpen ? "dashboard-sidebar" : "bg-transparent",
        )}
        aria-label="Sidebar"
      >
        <div
          className={cn(
            "flex w-full shrink-0 items-center p-2 text-muted-foreground",
            isOpen ? "justify-between gap-3" : "justify-center",
          )}
        >
          <AnimatePresence>
            {isOpen && header ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="min-w-0 flex-1"
              >
                {header}
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.button
            type="button"
            layout
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/5 hover:text-foreground"
            onClick={() => setIsOpen((open) => !open)}
          >
            <SidebarToggleIcon isOpen={isOpen} strokeWidth={2} className="size-6" />
          </motion.button>
        </div>

        <nav className="scrollbar-hide mt-2 min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence>
            {isOpen ? (
              <motion.div
                initial={{ opacity: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, filter: "blur(4px)" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="flex flex-col gap-4 w-full relative z-10"
                onMouseLeave={() => setHoveredKey(null)}
              >
                {sections.map((section) => (
                  <div key={section.label ?? section.items[0]?.href} className="space-y-1">
                    {section.label ? (
                      <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                        {section.label}
                      </p>
                    ) : null}
                    {section.items.map((item) => {
                      const key = item.href;
                      const active = isItemActive(item, activeHref);

                      return (
                        <div
                          key={key}
                          className="relative"
                          onMouseEnter={() => setHoveredKey(key)}
                          onMouseLeave={() => setHoveredKey(null)}
                        >
                          <AnimatePresence>
                            {active ? (
                              <motion.div
                                className="absolute inset-0 z-0 rounded-xl bg-primary/10"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                              />
                            ) : null}
                          </AnimatePresence>

                          <SidebarNavLink
                            item={item}
                            active={active}
                            onNavigate={onNavigate}
                            onItemSelect={onItemSelect}
                            className={cn(
                              "relative z-10 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left tracking-tight transition-colors",
                              active
                                ? "font-medium text-primary"
                                : "text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {item.icon ? (
                              <span className="shrink-0 opacity-80">{item.icon}</span>
                            ) : null}
                            <span className="truncate">{item.label}</span>
                          </SidebarNavLink>

                          <AnimatePresence>
                            {hoveredKey === key && !active ? (
                              <motion.span
                                layoutId="dashboard-sidebar-hover-bg"
                                className="pointer-events-none absolute inset-0 z-0 rounded-xl bg-muted/70"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{
                                  type: "spring",
                                  stiffness: 350,
                                  damping: 30,
                                }}
                              />
                            ) : null}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center gap-2 pt-2"
              >
                {sections.flatMap((section) =>
                  section.items.map((item) => {
                    const active = isItemActive(item, activeHref);
                    return (
                      <SidebarNavLink
                        key={item.href}
                        item={item}
                        active={active}
                        collapsed
                        onNavigate={onNavigate}
                        onItemSelect={onItemSelect}
                        className={cn(
                          "flex size-11 items-center justify-center rounded-xl transition-colors",
                          active
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {item.icon ?? null}
                      </SidebarNavLink>
                    );
                  }),
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </nav>

        {footer ? (
          <div className={cn("w-full shrink-0 pt-3", !isOpen && "hidden")}>
            {footer}
          </div>
        ) : null}
        {!isOpen && collapsedFooter ? (
          <div className="w-full shrink-0 border-t border-border/70 pt-3">
            {collapsedFooter}
          </div>
        ) : null}
      </motion.aside>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
