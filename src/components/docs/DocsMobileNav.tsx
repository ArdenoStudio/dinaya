"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { allGuides } from "@content/docs/guides";

export function DocsMobileNav() {
  const router = useRouter();

  return (
    <div className="lg:hidden mb-6">
      <label htmlFor="docs-mobile-nav" className="sr-only">
        Jump to a guide
      </label>
      <select
        id="docs-mobile-nav"
        className="w-full rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-sm shadow-sm shadow-gray-900/5 dark:shadow-black/20"
        defaultValue=""
        onChange={(e) => {
          if (e.target.value) router.push(e.target.value);
        }}
      >
        <option value="">Browse guides…</option>
        {allGuides.map((g) => (
          <option key={g.slug} value={`/docs/guides/${g.slug}`}>
            {g.title}
          </option>
        ))}
      </select>
      <p className="mt-2 text-center text-xs">
        <Link href="/docs" className="text-primary hover:underline">
          Documentation home
        </Link>
        {" · "}
        <Link href="/docs.md" className="text-primary hover:underline">
          Markdown
        </Link>
      </p>
    </div>
  );
}
