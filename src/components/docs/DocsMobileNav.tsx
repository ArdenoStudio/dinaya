"use client";

import Link from "next/link";
import { allGuides } from "@content/docs/guides";

export function DocsMobileNav() {
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
          if (e.target.value) window.location.href = e.target.value;
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
