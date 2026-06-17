"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docsCategories } from "@content/docs/categories";
import { getGuidesByCategory, allGuides } from "@content/docs/guides";
import { cn } from "@/lib/utils";

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <nav className="sticky top-24 space-y-6 rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:border-neutral-800 dark:bg-neutral-900/80 p-4 text-sm shadow-sm shadow-gray-900/5 dark:shadow-black/20 backdrop-blur" aria-label="Documentation">
        <div className="border-b border-gray-100 dark:border-neutral-800 pb-3">
          <Link
            href="/docs"
            className={cn(
              "font-cal text-base tracking-tight",
              pathname === "/docs" ? "text-primary" : "text-gray-900 dark:text-gray-100 hover:text-primary",
            )}
          >
            Documentation
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            {allGuides.length} guides
          </p>
        </div>

        {docsCategories.map((cat) => {
          const guides = getGuidesByCategory(cat.id);
          if (guides.length === 0) return null;
          return (
            <div key={cat.id}>
              <p className="mb-2 text-[0.68rem] font-semibold uppercase tracking-wider text-muted-foreground">
                {cat.label}
              </p>
              <ul className="space-y-1">
                {guides.map((g) => {
                  const href = `/docs/guides/${g.slug}`;
                  const active = pathname === href;
                  return (
                    <li key={g.slug}>
                      <Link
                        href={href}
                        className={cn(
                          "block rounded-md px-2 py-1.5 leading-snug transition-colors",
                          active
                            ? "bg-primary/10 font-medium text-primary"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:bg-neutral-900/60 hover:text-gray-900 dark:text-gray-100",
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

        <div className="border-t border-gray-100 dark:border-neutral-800 pt-4 space-y-2">
          <Link href="/docs.md" className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100">
            View Markdown docs
          </Link>
          <Link href="/llms.txt" className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100">
            LLM docs index
          </Link>
          <Link href="/help" className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100">
            FAQ / Help center
          </Link>
          <Link href="/docs/reference/plan-limits" className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100">
            Plan limits
          </Link>
          <Link href="/contact" className="block text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:text-gray-100">
            Contact support
          </Link>
        </div>
      </nav>
    </aside>
  );
}
