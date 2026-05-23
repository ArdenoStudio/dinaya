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
        className="w-full rounded-lg border bg-white px-3 py-2 text-sm"
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
      </p>
    </div>
  );
}
