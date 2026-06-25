"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { allGuides } from "@content/docs/guides";

export function DocsMobileNav() {
  const router = useRouter();

  return (
    <div className="mb-6 lg:hidden">
      <nav aria-label="Documentation guides" className="mb-4 flex flex-col gap-1">
        <Link
          href="/docs"
          className="flex min-h-11 items-center rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-100"
        >
          Documentation home
        </Link>
        {allGuides.slice(0, 6).map((guide) => (
          <Link
            key={guide.slug}
            href={`/docs/guides/${guide.slug}`}
            className="flex min-h-11 items-center rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300"
          >
            {guide.title}
          </Link>
        ))}
      </nav>
      <label htmlFor="docs-mobile-nav" className="sr-only">
        Jump to a guide
      </label>
      <select
        id="docs-mobile-nav"
        className="min-h-11 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-base shadow-sm shadow-gray-900/5 dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-black/20"
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) router.push(e.target.value);
        }}
      >
        <option value="">Browse all guides…</option>
        {allGuides.map((g) => (
          <option key={g.slug} value={`/docs/guides/${g.slug}`}>
            {g.title}
          </option>
        ))}
      </select>
      <p className="mt-2 text-center text-xs">
        <Link href="/docs.md" className="text-primary hover:underline">
          Markdown export
        </Link>
      </p>
    </div>
  );
}
