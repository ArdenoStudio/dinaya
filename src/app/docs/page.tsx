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
import { DocsAiActions } from "@/components/docs/DocsAiActions";
import { DOCS_HUB_MARKDOWN_PATH, DOCS_HUB_PATH } from "@/lib/docs/paths";

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
      <div className="relative mb-10 overflow-hidden rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/70 px-6 py-8 shadow-sm shadow-gray-900/5">
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1 text-xs font-semibold text-blue-700">
              <Icon name="book" className="text-xs" />
              Documentation
            </span>
            <h1 className="font-cal text-3xl tracking-tight text-gray-950 md:text-4xl">
              Learn Dinaya
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-gray-600">
              Step-by-step guides with UI walkthroughs for setup, operations, growth, and integrations.
            </p>
          </div>
          <DocsAiActions
            title="Dinaya Documentation"
            summary="Step-by-step product guides for bookings, payments, growth, and dashboard operations."
            canonicalPath={DOCS_HUB_PATH}
            markdownPath={DOCS_HUB_MARKDOWN_PATH}
            className="md:shrink-0"
          />
        </div>
      </div>

      <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm shadow-gray-900/5" aria-label="How documentation walkthroughs work">
        <div className="grid gap-2 md:grid-cols-3">
          {walkthroughCues.map((cue, index) => (
            <div key={cue.label} className="flex gap-3 rounded-xl border border-gray-100 bg-gradient-to-b from-white to-gray-50/70 px-3 py-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-blue-100 bg-blue-50 text-primary">
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
          className="w-full rounded-2xl border border-gray-200 bg-white pl-10 pr-4 py-3 text-sm shadow-sm shadow-gray-900/5 focus:outline-none focus:ring-2 focus:ring-primary/40"
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
                  className="group rounded-2xl border border-gray-200 bg-gradient-to-br from-blue-50/50 to-white p-4 shadow-sm shadow-gray-900/5 transition-all hover:border-primary/30 hover:shadow-md"
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
                  className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/5 transition-all hover:border-primary/30 hover:shadow-md"
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
                        className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-sm shadow-gray-900/5 transition hover:border-primary/30 hover:bg-gray-50/80"
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

          <section className="rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6">
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
