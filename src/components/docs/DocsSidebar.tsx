"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsCategories } from "@content/docs/categories";
import { getGuidesByCategory, allGuides } from "@content/docs/guides";
import { cn } from "@/lib/utils";

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 lg:block">
      <nav
        className="sticky top-24 space-y-7 rounded-2xl border border-black/[0.06] bg-white/90 p-4 text-sm shadow-[0_1px_2px_rgba(0,0,0,0.03),0_10px_24px_-16px_rgba(0,0,0,0.12)] backdrop-blur dark:border-white/[0.08] dark:bg-neutral-900/80"
        aria-label="Documentation"
      >
        <div className="border-b border-black/[0.05] pb-3 dark:border-white/[0.07]">
          <Link
            href="/docs"
            className={cn(
              "font-cal text-base tracking-tight",
              pathname === "/docs" ? "text-primary" : "text-foreground hover:text-primary",
            )}
          >
            Documentation
          </Link>
          <p className="mt-1 text-xs tabular-nums text-muted-foreground">
            {allGuides.length} guides
          </p>
        </div>

        {docsCategories.map((cat) => {
          const guides = getGuidesByCategory(cat.id);
          if (guides.length === 0) return null;
          return (
            <div key={cat.id}>
              <p className="mb-2 text-[0.65rem] font-medium uppercase tracking-[0.1em] text-foreground/40">
                {cat.label}
              </p>
              <ul className="space-y-0.5">
                {guides.map((g) => {
                  const href = `/docs/guides/${g.slug}`;
                  const active = pathname === href;
                  return (
                    <li key={g.slug}>
                      <Link
                        href={href}
                        className={cn(
                          "block rounded-lg px-2 py-1.5 leading-snug transition-colors duration-150 ease-[cubic-bezier(0.2,0,0,1)]",
                          active
                            ? "bg-foreground/[0.06] font-medium text-foreground dark:bg-white/[0.08]"
                            : "text-foreground/70 hover:bg-foreground/[0.03] hover:text-foreground",
                        )}
                      >
                        {g.title}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        <div className="space-y-2 border-t border-black/[0.05] pt-4 dark:border-white/[0.07]">
          <Link href="/docs.md" className="block text-foreground/55 transition-colors hover:text-foreground">
            View Markdown docs
          </Link>
          <Link href="/llms.txt" className="block text-foreground/55 transition-colors hover:text-foreground">
            LLM docs index
          </Link>
          <Link href="/help" className="block text-foreground/55 transition-colors hover:text-foreground">
            FAQ / Help center
          </Link>
          <Link href="/docs/reference/plan-limits" className="block text-foreground/55 transition-colors hover:text-foreground">
            Plan limits
          </Link>
          <Link href="/contact" className="block text-foreground/55 transition-colors hover:text-foreground">
            Contact support
          </Link>
        </div>
      </nav>
    </aside>
  );
}
