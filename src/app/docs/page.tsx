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
import { DocsGuideThumbnail } from "@/components/docs/DocsGuideThumbnail";
import { DocsHeroPreview } from "@/components/docs/DocsHeroPreview";
import { DOCS_HUB_MARKDOWN_PATH, DOCS_HUB_PATH } from "@/lib/docs/paths";
import { getGuidePreviewMockupId } from "@/lib/docs/visuals";

export default function DocsHubPage() {
  const [search, setSearch] = useState("");
  const results = useMemo(() => searchGuides(search), [search]);
  const totalSteps = allGuides.reduce((sum, guide) => sum + guide.steps.length, 0);

  const walkthroughCues = [
    {
      label: "Choose a guide",
      text: "Start from a topic card, search result, or the docs sidebar.",
    },
    {
      label: "Watch the mark",
      text: "Guided steps light up the exact menu item or button in the product preview.",
    },
    {
      label: "Move step by step",
      text: "Use Next when you are ready — each step stays focused on one action.",
    },
  ];

  return (
    <div className="pb-16">
      <div className="relative mb-10 overflow-hidden rounded-[1.75rem] border border-black/[0.06] bg-[hsl(240_8%_98%)] px-6 py-8 dark:border-white/[0.08] dark:bg-[hsl(240_6%_7%)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(37,99,235,0.07),transparent_55%)]"
          aria-hidden
        />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="mb-3 text-[0.7rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
              Documentation
            </p>
            <h1 className="font-cal text-3xl tracking-tight text-balance text-gray-950 dark:text-white md:text-4xl">
              Learn Dinaya
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-pretty text-gray-600 dark:text-gray-400">
              Clear guides with product walkthroughs — setup, bookings, payments, and growth.
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
        <DocsHeroPreview />
      </div>

      <section className="mb-10" aria-label="How documentation walkthroughs work">
        <div className="grid gap-6 md:grid-cols-3 md:gap-8">
          {walkthroughCues.map((cue, index) => (
            <div key={cue.label} className="min-w-0">
              <p className="text-[0.65rem] font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </p>
              <p className="mt-2 font-cal text-base tracking-tight text-gray-950 dark:text-white">
                {cue.label}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{cue.text}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          {allGuides.length} guides · {totalSteps} guided steps
        </p>
      </section>

      <div className="relative mb-10">
        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search guides…"
          aria-label="Search documentation guides"
          className="w-full rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:border-neutral-800 dark:bg-neutral-900 pl-10 pr-4 py-3 text-sm shadow-sm shadow-gray-900/5 dark:shadow-black/20 focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      {search ? (
        <section>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4">
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
                    <DocsGuideThumbnail
                      mockupId={getGuidePreviewMockupId(g)}
                      className="hidden h-16 w-24 shrink-0 sm:block"
                    />
                    <div className="min-w-0 flex-1">
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
            <div className="rounded-xl border border-dashed bg-gray-50 dark:bg-neutral-900/60 p-6 text-center">
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
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4">
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
                    className="group overflow-hidden rounded-2xl border border-gray-200 dark:border-neutral-800 bg-gradient-to-br from-blue-50/50 to-white shadow-sm shadow-gray-900/5 dark:shadow-black/20 transition-[transform,box-shadow,border-color] duration-150 ease-out hover:border-primary/30 hover:shadow-md active:scale-[0.99] motion-reduce:active:scale-100"
                  >
                    <DocsGuideThumbnail mockupId={getGuidePreviewMockupId(g)} className="rounded-none border-0 border-b" />
                    <div className="p-4">
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
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>

          <section className="mb-12" id="categories">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4">
              Browse by topic
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {docsCategories.map((cat) => (
                <a
                  key={cat.id}
                  href={`#${cat.id}`}
                  className="rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-4 shadow-sm shadow-gray-900/5 dark:shadow-black/20 transition-[transform,box-shadow,border-color] duration-150 ease-out hover:border-primary/30 hover:shadow-md active:scale-[0.99] motion-reduce:active:scale-100"
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
                        className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:border-neutral-800 dark:bg-neutral-900 px-4 py-3 shadow-sm shadow-gray-900/5 dark:shadow-black/20 transition-[box-shadow,border-color,background-color] duration-150 ease-out hover:border-primary/30 hover:bg-gray-50 dark:bg-neutral-900/60"
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

          <section className="rounded-3xl border border-gray-200 dark:border-neutral-800 bg-gradient-to-br from-gray-50 to-white p-6">
            <h2 className="font-cal text-lg mb-2">Quick answers</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Prefer short FAQ-style answers? Visit the help center.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/help" className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary/90">
                Help center
              </Link>
              <Link href="/docs/reference/plan-limits" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-white dark:hover:bg-neutral-800">
                Plan limits
              </Link>
              <Link href="/whats-new" className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-white dark:hover:bg-neutral-800">
                What&apos;s new
              </Link>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
