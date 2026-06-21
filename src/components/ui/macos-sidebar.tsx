"use client";

import { PlusSignIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState, type ReactNode } from "react";
import { SidebarToggleIcon } from "@/components/unlumen-ui/sidebar-toggle-icon";
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
}: {
  item: MacOSSidebarItem;
  active: boolean;
  className: string;
  onNavigate?: () => void;
  onItemSelect?: (href: string) => void;
  children: ReactNode;
}) {
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

  return (
    <div
      className={cn(
        "flex bg-neutral-200 dark:bg-neutral-900 relative w-full overflow-hidden",
        className,
      )}
    >
      <motion.aside
        animate={{ width: isOpen ? 240 : 64 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
        className={cn(
          "hidden lg:flex lg:h-full lg:max-h-full p-2 shrink-0 flex-col items-start transition-colors duration-300 ease-out",
          isOpen ? "bg-neutral-100 dark:bg-neutral-800" : "bg-transparent",
        )}
        aria-label="Sidebar"
      >
        <div
          className={cn(
            "flex items-center w-full text-neutral-700 dark:text-neutral-300 p-2 shrink-0",
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
            className="shrink-0 flex size-11 items-center justify-center rounded-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200/80 dark:hover:bg-neutral-700/80 transition-colors"
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
                      <p className="px-3 text-[0.68rem] font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
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
                                className="absolute inset-0 z-0 bg-neutral-200 dark:bg-neutral-700 rounded-md"
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
                              "relative z-10 flex items-center gap-2.5 px-3 py-2.5 rounded-md tracking-tight transition-colors w-full text-left",
                              active
                                ? "text-neutral-900 dark:text-neutral-100 font-medium"
                                : "text-neutral-700 dark:text-neutral-200/70 hover:text-neutral-900 dark:hover:text-neutral-100",
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
                                className="absolute inset-0 z-0 bg-neutral-200/50 dark:bg-neutral-900/50 rounded-md pointer-events-none"
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
                        onNavigate={onNavigate}
                        onItemSelect={onItemSelect}
                        className={cn(
                          "flex size-11 items-center justify-center rounded-md transition-colors",
                          active
                            ? "bg-neutral-200 dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
                            : "text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/70 dark:hover:bg-neutral-700/70",
                        )}
                      >
                        {item.icon}
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
          <div className="w-full shrink-0 border-t border-neutral-200/80 pt-3 dark:border-neutral-700/80">
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

// Keep registry-compatible export for demos
export interface MacOSSidebarDemoProps {
  items: string[];
  defaultOpen?: boolean;
  initialSelectedIndex?: number;
  children?: ReactNode;
  className?: string;
}

export function MacOSSidebarDemo({
  items,
  defaultOpen = true,
  initialSelectedIndex = 0,
  children,
  className,
}: MacOSSidebarDemoProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(initialSelectedIndex);
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div
      className={cn(
        "flex bg-neutral-200 dark:bg-neutral-900 rounded-3xl p-3 relative w-full sm:min-w-[480px] overflow-hidden",
        className,
      )}
    >
      <motion.div
        animate={{ width: isOpen ? 240 : 64 }}
        transition={{ type: "spring", bounce: 0.4, duration: 0.8 }}
        className={cn(
          "p-2 rounded-2xl shrink-0 flex flex-col items-start transition-colors duration-900 ease-out",
          isOpen ? "bg-neutral-100 dark:bg-neutral-800" : "bg-transparent",
        )}
      >
        <div
          className={cn(
            "flex items-center w-full text-neutral-700 dark:text-neutral-300 p-2 shrink-0",
            isOpen ? "justify-end gap-4" : "justify-center",
          )}
        >
          <AnimatePresence>
            {isOpen ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
              >
                <HugeiconsIcon icon={PlusSignIcon} className="size-5 cursor-pointer" />
              </motion.div>
            ) : null}
          </AnimatePresence>
          <motion.button
            type="button"
            layout
            aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="shrink-0 flex items-center justify-center"
            onClick={() => setIsOpen((open) => !open)}
          >
            <SidebarToggleIcon isOpen={isOpen} strokeWidth={2} className="size-6" />
          </motion.button>
        </div>

        <AnimatePresence>
          {isOpen ? (
            <motion.div
              initial={{ opacity: 0, filter: "blur(4px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col gap-2 mt-4 w-full relative z-10 whitespace-nowrap"
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {items.map((item, index) => (
                <div
                  key={item}
                  className="relative cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onClick={() => setSelectedIndex(index)}
                >
                  <AnimatePresence>
                    {selectedIndex === index ? (
                      <motion.div
                        className="absolute inset-0 z-0 bg-neutral-200 dark:bg-neutral-700 rounded-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      />
                    ) : null}
                  </AnimatePresence>
                  <p
                    className={cn(
                      "relative z-10 px-5 py-3 tracking-tight",
                      selectedIndex === index
                        ? "text-neutral-900 dark:text-neutral-100 font-medium"
                        : "text-neutral-700 dark:text-neutral-200/50",
                    )}
                  >
                    {item}
                  </p>
                  <AnimatePresence>
                    {hoveredIndex === index && selectedIndex !== index ? (
                      <motion.span
                        layoutId="sidebar-hover-bg"
                        className="absolute inset-0 z-0 bg-neutral-200/50 dark:bg-neutral-900/50 rounded-md"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    ) : null}
                  </AnimatePresence>
                </div>
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </motion.div>

      <div className="flex-1 w-full h-full min-h-full overflow-y-auto z-0 pl-4 lg:pl-8">
        {children}
      </div>
    </div>
  );
}
