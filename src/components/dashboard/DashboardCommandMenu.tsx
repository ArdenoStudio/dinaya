"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from "react";
import {
  CalendarPlus,
  Search,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import { useDashboardCopy, useDashboardRole } from "@/components/dashboard/DashboardLocaleProvider";
import { trackDashboardNavClick } from "@/lib/analytics/gtag";
import { dashboardNavGroups } from "@/lib/dashboard-nav";
import { cn } from "@/lib/utils";

type CommandItem = {
  href: string;
  label: string;
  group: string;
  icon: LucideIcon;
  keywords?: string;
};

type FlatEntry = {
  href: string;
  label: ReactNode;
  group: string;
  icon: LucideIcon;
  key: string;
};

type DashboardCommandMenuProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNavigate?: (href: string) => void;
};

export function DashboardCommandMenu({
  open,
  onOpenChange,
  onNavigate,
}: DashboardCommandMenuProps) {
  const router = useRouter();
  const copy = useDashboardCopy();
  const role = useDashboardRole();
  const isOwner = role === "owner";
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const items = useMemo<CommandItem[]>(() => {
    const navItems = dashboardNavGroups.flatMap((group) =>
      group.links
        .filter((link) => isOwner || !link.ownerOnly)
        .map((link) => ({
          href: link.href,
          label: copy.nav[link.labelKey],
          group: copy.navGroups[group.labelKey],
          icon: link.icon,
          keywords: `${link.labelKey} ${link.href}`,
        })),
    );

    const actions: CommandItem[] = [
      {
        href: "/dashboard/bookings/new",
        label: "New booking",
        group: "Actions",
        icon: CalendarPlus,
        keywords: "create appointment",
      },
      {
        href: "/dashboard/clients/new",
        label: "New client",
        group: "Actions",
        icon: UserPlus,
        keywords: "add customer",
      },
      {
        href: "/dashboard/search",
        label: "Open search",
        group: "Actions",
        icon: Search,
        keywords: "find",
      },
    ];

    return [...actions, ...navItems];
  }, [copy.nav, copy.navGroups, isOwner]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => {
      const haystack = `${item.label} ${item.group} ${item.keywords ?? ""}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [items, query]);

  const trimmedQuery = query.trim();

  function go(href: string) {
    onOpenChange(false);
    if (onNavigate) {
      onNavigate(href);
      return;
    }
    trackDashboardNavClick({ href, surface: "command" });
    router.push(href);
  }

  const groups = useMemo(() => {
    const map = new Map<string, CommandItem[]>();
    for (const item of filtered) {
      const list = map.get(item.group) ?? [];
      list.push(item);
      map.set(item.group, list);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const flatEntries = useMemo<FlatEntry[]>(() => {
    const entries: FlatEntry[] = [];
    if (trimmedQuery) {
      entries.push({
        href: `/dashboard/search?q=${encodeURIComponent(trimmedQuery)}`,
        label: (
          <>
            Search bookings, clients &amp; services for <span className="font-semibold">&ldquo;{trimmedQuery}&rdquo;</span>
          </>
        ),
        group: "Search",
        icon: Search,
        key: "search-fallback",
      });
    }
    for (const [group, groupItems] of groups) {
      for (const item of groupItems) {
        entries.push({
          href: item.href,
          label: item.label,
          group,
          icon: item.icon,
          key: `${group}-${item.href}-${item.label}`,
        });
      }
    }
    return entries;
  }, [groups, trimmedQuery]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  useEffect(() => {
    const activeKey = flatEntries[activeIndex]?.key;
    if (!activeKey) return;
    document.getElementById(activeKey)?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, flatEntries]);

  function onInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (flatEntries.length ? (current + 1) % flatEntries.length : 0));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => (flatEntries.length ? (current - 1 + flatEntries.length) % flatEntries.length : 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const active = flatEntries[activeIndex];
      if (active) go(active.href);
    }
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[80] bg-black/45 backdrop-blur-[2px]" />
        <Dialog.Content
          className="fixed left-1/2 top-[12vh] z-[81] w-[min(36rem,calc(100vw-1.5rem))] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl outline-none"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">Command menu</Dialog.Title>
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onInputKeyDown}
              placeholder="Jump to a page or action…"
              className="h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label="Filter commands"
              role="combobox"
              aria-expanded="true"
              aria-controls="dashboard-command-list"
              aria-activedescendant={flatEntries[activeIndex]?.key}
            />
            <kbd className="hidden rounded-md border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
              ESC
            </kbd>
          </div>
          <div id="dashboard-command-list" role="listbox" className="max-h-[min(24rem,50vh)] overflow-y-auto p-2">
            {flatEntries.length === 0 ? (
              <p className="px-3 py-8 text-center text-sm text-muted-foreground">No matches.</p>
            ) : (
              (() => {
                let runningIndex = -1;
                const entriesByGroup = new Map<string, FlatEntry[]>();
                for (const entry of flatEntries) {
                  const list = entriesByGroup.get(entry.group) ?? [];
                  list.push(entry);
                  entriesByGroup.set(entry.group, list);
                }
                return Array.from(entriesByGroup.entries()).map(([group, groupEntries]) => (
                  <div key={group} className="mb-2 last:mb-0">
                    <p className="px-2 py-1.5 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                      {group}
                    </p>
                    <ul className="space-y-0.5">
                      {groupEntries.map((entry) => {
                        runningIndex += 1;
                        const index = runningIndex;
                        const Icon = entry.icon;
                        const active = index === activeIndex;
                        return (
                          <li key={entry.key} id={entry.key} role="option" aria-selected={active}>
                            <button
                              type="button"
                              onClick={() => go(entry.href)}
                              onMouseEnter={() => setActiveIndex(index)}
                              className={cn(
                                "flex min-h-11 w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors",
                                active ? "bg-primary/5 text-foreground" : "hover:bg-primary/5 hover:text-foreground",
                                "focus-visible:bg-primary/5 focus-visible:outline-none",
                              )}
                            >
                              <span
                                className={cn(
                                  "flex size-8 items-center justify-center rounded-lg",
                                  entry.group === "Search" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                                )}
                              >
                                <Icon className="size-4" aria-hidden="true" />
                              </span>
                              <span className="min-w-0 flex-1 truncate font-medium">{entry.label}</span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ));
              })()
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export function useDashboardCommandShortcut(onOpen: () => void) {
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onOpen]);
}
