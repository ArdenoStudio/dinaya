"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { docsCategories } from "@content/docs/categories";
import {
  allGuides,
  featuredGuideSlugs,
  guidesBySlug,
  searchGuides,
} from "@content/docs/guides";
import { PlanBadge } from "@/components/docs/PlanBadge";

export default function DocsHubPage() {
  const [search, setSearch] = useState("");
  const results = useMemo(() => searchGuides(search), [search]);

  return (
    <div className="pb-16">
      <div className="mb-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/50 px-3 py-1 text-xs font-medium text-blue-700 mb-4">
          <i className="bi bi-book text-xs" />
          Documentation
        </span>
        <h1 className="font-cal text-3xl md:text-4xl tracking-tight mb-2">
          Learn Dinaya
        </h1>
        <p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
          Step-by-step guides with UI walkthroughs — including where to click — for every feature.
        </p>
      </div>

      <div className="relative mb-10">
        <i className="bi bi-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guides…"
          className="w-full rounded-xl border pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {search ? (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </h2>
          <ul className="space-y-2">
            {results.map((g) => (
              <li key={g.slug}>
                <Link
                  href={`/docs/guides/${g.slug}`}
                  className="flex items-center justify-between rounded-xl border p-4 hover:border-primary/30 hover:shadow-sm"
                >
                  <div>
                    <p className="font-cal text-base">{g.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>
                  </div>
                  <i className="bi bi-chevron-right text-gray-300" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <>
          <section className="mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Start here
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {featuredGuideSlugs.map((slug) => {
                const g = guidesBySlug[slug];
                if (!g) return null;
                return (
                  <Link
                    key={slug}
                    href={`/docs/guides/${slug}`}
                    className="rounded-xl border bg-gradient-to-br from-blue-50/80 to-white p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <p className="font-cal text-base tracking-tight">{g.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.description}</p>
                    <p className="text-[11px] text-primary mt-2 font-medium">
                      {g.estimatedMinutes} min · {g.steps.length} steps
                    </p>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mb-12" id="categories">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
              Browse by topic
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {docsCategories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className="rounded-xl border p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <i className={`bi ${cat.icon} text-primary`} />
                    <p className="font-cal text-base">{cat.label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                </a>
              ))}
            </div>
          </section>

          {docsCategories.map((cat) => {
            const guides = allGuides.filter((g) => g.category === cat.id);
            if (guides.length === 0) return null;
            return (
              <section key={cat.id} id={cat.id} className="mb-10 scroll-mt-24">
                <h2 className="font-cal text-xl tracking-tight mb-4">{cat.label}</h2>
                <ul className="space-y-2">
                  {guides.map((g) => (
                    <li key={g.slug}>
                      <Link
                        href={`/docs/guides/${g.slug}`}
                        className="flex items-center gap-3 rounded-lg border px-4 py-3 hover:bg-gray-50/80"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{g.title}</span>
                            {g.planRequired ? <PlanBadge plan={g.planRequired} /> : null}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">{g.description}</p>
                        </div>
                        <span className="text-[11px] text-muted-foreground shrink-0">
                          {g.steps.length} steps
                        </span>
                        <i className="bi bi-chevron-right text-gray-300 shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <section className="rounded-2xl border bg-gray-50 p-6">
            <h2 className="font-cal text-lg mb-2">Quick answers</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Prefer short FAQ-style answers? Visit the help center.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/help" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                Help center
              </Link>
              <Link href="/docs/reference/plan-limits" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-white">
                Plan limits
              </Link>
              <Link href="/whats-new" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-white">
                What&apos;s new
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
