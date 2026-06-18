"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { faqCategories, popularHelpArticles } from "@content/docs/faq";
import { Icon } from "@/components/ui/Icon";

export function HelpFaqSections() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return faqCategories;
    return faqCategories
      .map((cat) => ({
        ...cat,
        faqs: cat.faqs.filter(
          (faq) =>
            faq.q.toLowerCase().includes(q) || faq.a.toLowerCase().includes(q),
        ),
      }))
      .filter((cat) => cat.faqs.length > 0);
  }, [search]);

  const displayed =
    activeCategory && !search
      ? filtered.filter((c) => c.id === activeCategory)
      : filtered;

  const totalResults = filtered.reduce((sum, c) => sum + c.faqs.length, 0);

  return (
    <>
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-blue-50/60 to-white dark:from-blue-950/30 dark:to-neutral-950 dark:border-neutral-800">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(circle, #bfdbfe 1px, transparent 1px)",
            backgroundSize: "28px 28px",
            maskImage: "radial-gradient(ellipse 80% 100% at 50% 0%, black 40%, transparent 100%)",
          }}
        />
        <div className="relative max-w-3xl mx-auto px-6 public-page-offset pb-20 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-blue-200 dark:border-blue-800/60 bg-white dark:bg-neutral-900 px-3 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 shadow-sm mb-5">
            <Icon name="question-circle" className="text-xs" />
            Help Center
          </span>
          <h1 className="font-cal text-4xl md:text-5xl tracking-tight mb-3">How can we help?</h1>
          <p className="text-muted-foreground mb-4 max-w-sm mx-auto">
            Search for answers, or browse by category below.
          </p>
          <p className="text-sm mb-8">
            <Link href="/docs" className="text-primary font-medium hover:underline">
              View step-by-step guides →
            </Link>
          </p>
          <div className="w-full max-w-xl mx-auto relative">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 text-sm pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setActiveCategory(null);
              }}
              placeholder="Search help topics — e.g. refund, availability"
              className="w-full rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 pl-10 pr-4 py-3.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            {search && (
              <p className="text-xs text-muted-foreground mt-2 text-left pl-1">
                {totalResults === 0
                  ? "No results found."
                  : `${totalResults} result${totalResults === 1 ? "" : "s"} found`}
              </p>
            )}
          </div>
        </div>
      </section>

      {!search && (
        <section className="max-w-4xl mx-auto px-6 py-10">
          <h2 className="text-xs font-semibold tracking-widest uppercase text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500 mb-4">
            Popular articles
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {popularHelpArticles.map((a) => {
              const cat = faqCategories.find((c) => c.id === a.cat)!;
              const inner = (
                <>
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cat.colorClasses.icon} text-white`}>
                    <Icon name={a.icon} className="text-xs" />
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:text-gray-100 leading-snug">{a.label}</span>
                  <Icon name="chevron-right" className="ml-auto text-xs text-gray-300" />
                </>
              );
              if (a.guideSlug) {
                return (
                  <Link
                    key={a.label}
                    href={`/docs/guides/${a.guideSlug}`}
                    className="group flex items-center gap-3 rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-3.5 hover:border-primary/30 hover:shadow-sm transition-all"
                  >
                    {inner}
                  </Link>
                );
              }
              return (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => {
                    setActiveCategory(a.cat);
                    document.getElementById(a.cat)?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="group flex items-center gap-3 rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900 p-3.5 text-left hover:border-primary/30 hover:shadow-sm transition-all w-full"
                >
                  {inner}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {!search && (
        <div className="sticky top-24 z-40 bg-white/90 backdrop-blur dark:bg-neutral-950/90-sm border-b dark:bg-neutral-950/90 dark:border-neutral-800">
          <div className="max-w-4xl mx-auto px-6 flex gap-1 overflow-x-auto py-2">
            <button
              type="button"
              onClick={() => setActiveCategory(null)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                activeCategory === null ? "bg-gray-900 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-neutral-800"
              }`}
            >
              All topics
            </button>
            {faqCategories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  document.getElementById(cat.id)?.scrollIntoView({ behavior: "smooth" });
                }}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium ${
                  activeCategory === cat.id ? `${cat.colorClasses.accent} text-white` : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:bg-neutral-800"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-6 py-10 space-y-12 pb-20">
        {displayed.map((cat) => (
          <section key={cat.id} id={cat.id} className="scroll-mt-28">
            <div className="flex items-center gap-3 mb-6">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${cat.colorClasses.icon} text-white`}>
                <Icon name={cat.icon} className="text-base" />
              </span>
              <div>
                <h2 className="font-cal text-xl tracking-tight">{cat.label}</h2>
                <p className="text-xs text-muted-foreground">{cat.faqs.length} articles</p>
              </div>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-neutral-800 overflow-hidden divide-y divide-gray-200 dark:divide-neutral-800">
              {cat.faqs.map((faq) => (
                <details key={faq.id} className="group bg-white dark:bg-neutral-900">
                  <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 hover:bg-gray-50 dark:hover:bg-neutral-800/80">
                    <span className="font-cal text-base tracking-tight text-gray-900 dark:text-gray-100 leading-snug">{faq.q}</span>
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border group-open:bg-primary group-open:text-white group-open:border-primary">
                      <svg className="size-3 group-open:rotate-45 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-5">
                    <p className="text-sm text-muted-foreground leading-relaxed pr-8">{faq.a}</p>
                    {faq.guideSlug ? (
                      <Link
                        href={`/docs/guides/${faq.guideSlug}`}
                        className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                      >
                        Read full guide
                        <Icon name="arrow-right" className="text-xs" />
                      </Link>
                    ) : null}
                  </div>
                </details>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
