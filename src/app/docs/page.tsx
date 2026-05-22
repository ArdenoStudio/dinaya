"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { docsCategories } from "@content/docs/categories";
import { Icon } from "@/components/ui/Icon";
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
  const totalSteps = allGuides.reduce((sum, guide) => sum + guide.steps.length, 0);

  const walkthroughCues = [
    {
      icon: "compass",
      label: "Choose a guide",
      text: "Start from a topic card, search result, or the docs sidebar.",
    },
    {
      icon: "cursor-fill",
      label: "Follow the pointer",
      text: "Every walkthrough highlights the exact menu item, button, or field.",
    },
    {
      icon: "arrow-right-circle",
      label: "Move step by step",
      text: "Use the large step buttons or Next to continue without getting lost.",
    },
  ];

  return (
    <div className="pb-16">
      <div className="mb-10">
        <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/50 px-3 py-1 text-xs font-medium text-blue-700 mb-4">
          <Icon name="book" className="text-xs" />
          Documentation
        </span>
        <h1 className="font-cal text-3xl md:text-4xl tracking-tight mb-2">
          Learn Dinaya
        </h1>
        <p className="text-muted-foreground max-w-lg text-sm leading-relaxed">
          Step-by-step guides with UI walkthroughs — including where to click — for every feature.
        </p>
      </div>

      <section className="mb-8 rounded-xl border bg-gray-50/70 p-3" aria-label="How documentation walkthroughs work">
        <div className="grid gap-2 md:grid-cols-3">
          {walkthroughCues.map((cue, index) => (
            <div key={cue.label} className="flex gap-3 rounded-lg bg-white px-3 py-3 shadow-sm shadow-gray-900/5">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border bg-white text-primary">
                <Icon name={cue.icon} className="text-sm" />
              </span>
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  {index + 1}. {cue.label}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{cue.text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 text-center text-[11px] font-medium text-muted-foreground">
          {allGuides.length} guides with {totalSteps} guided steps
        </p>
      </section>

      <div className="relative mb-10">
        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guides…"
          aria-label="Search documentation guides"
          className="w-full rounded-xl border pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {search ? (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">
            {results.length} result{results.length !== 1 ? "s" : ""}
          </h2>
          {results.length > 0 ? (
            <ul className="space-y-2">
              {results.map((g) => (
                <li key={g.slug}>
                  <Link
                    href={`/docs/guides/${g.slug}`}
                    className="flex items-center justify-between gap-4 rounded-xl border p-4 hover:border-primary/30 hover:shadow-sm"
                  >
                    <div>
                      <p className="font-cal text-base">{g.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{g.description}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-medium text-primary">
                      Open
                      <Icon name="chevron-right" className="text-[10px]" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="rounded-xl border border-dashed bg-gray-50 p-6 text-center">
              <p className="font-cal text-base">No guide found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Try searching for payments, services, staff, calendar, or reviews.
              </p>
            </div>
          )}
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
                    className="group rounded-xl border bg-gradient-to-br from-blue-50/80 to-white p-4 hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    <p className="font-cal text-base tracking-tight">{g.title}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{g.description}</p>
                    <div className="mt-3 flex items-center justify-between gap-3">
                      <p className="text-[11px] text-primary font-medium">
                        {g.estimatedMinutes} min · {g.steps.length} steps
                      </p>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary group-hover:underline">
                        Open guide
                        <Icon name="arrow-right" className="text-[10px]" />
                      </span>
                    </div>
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
                    <Icon name={cat.icon} className="text-primary" />
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
                        <Icon name="chevron-right" className="text-gray-300 shrink-0" />
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
