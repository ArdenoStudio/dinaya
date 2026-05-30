import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/ui/Icon";
import { guidesBySlug, allGuides } from "@content/docs/guides";
import { getCategoryLabel } from "@content/docs/categories";
import { UiWalkthrough } from "@/components/docs/UiWalkthrough";
import { PlanBadge } from "@/components/docs/PlanBadge";
import { DocsAiActions } from "@/components/docs/DocsAiActions";
import { getGuideMarkdownPath, getGuidePagePath } from "@/lib/docs/paths";
import { buildAbsoluteAppUrl } from "@/lib/docs/site-url";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return allGuides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = guidesBySlug[slug];
  if (!guide) return { title: "Guide not found" };

  const canonicalPath = getGuidePagePath(guide.slug);
  const markdownPath = getGuideMarkdownPath(guide.slug);

  return {
    title: `${guide.title} — Dinaya Docs`,
    description: guide.description,
    alternates: {
      canonical: buildAbsoluteAppUrl(canonicalPath),
      types: {
        "text/markdown": buildAbsoluteAppUrl(markdownPath),
      },
    },
  };
}

export default async function GuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = guidesBySlug[slug];
  if (!guide) notFound();

  const categoryLabel = getCategoryLabel(guide.category);
  const related = (guide.relatedGuides ?? [])
    .map((s) => guidesBySlug[s])
    .filter(Boolean);

  return (
    <article className="pb-16">
      <nav className="text-xs text-muted-foreground mb-6 flex flex-wrap items-center gap-1">
        <Link href="/docs" className="hover:text-foreground">
          Docs
        </Link>
        <Icon name="chevron-right" className="text-[10px]" />
        <span>{categoryLabel}</span>
        <Icon name="chevron-right" className="text-[10px]" />
        <span className="text-foreground">{guide.title}</span>
      </nav>

      <header className="mb-10 rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/60 px-6 py-6 shadow-sm shadow-gray-900/5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {guide.planRequired ? <PlanBadge plan={guide.planRequired} /> : null}
            <span className="text-xs text-muted-foreground">
              {guide.estimatedMinutes} min read · {guide.steps.length} steps
            </span>
          </div>
          <DocsAiActions
            title={guide.title}
            summary={guide.description}
            canonicalPath={getGuidePagePath(guide.slug)}
            markdownPath={getGuideMarkdownPath(guide.slug)}
          />
        </div>
        <h1 className="font-cal text-3xl md:text-4xl tracking-tight">{guide.title}</h1>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed max-w-xl">
          {guide.description}
        </p>
        {guide.planRequired ? (
          <p className="mt-4 text-sm">
            Requires{" "}
            <Link href="/pricing" className="text-primary font-medium hover:underline">
              {guide.planRequired} plan
            </Link>
            .
          </p>
        ) : null}
      </header>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading walkthrough…</p>}>
        <UiWalkthrough steps={guide.steps} />
      </Suspense>

      {related.length > 0 ? (
        <section className="mt-14 border-t border-gray-200 pt-10">
          <h2 className="font-cal text-lg tracking-tight mb-4">Related guides</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/docs/guides/${r.slug}`}
                  className="block rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-sm shadow-gray-900/5 transition hover:border-primary/30 hover:shadow-md"
                >
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10 rounded-3xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-6 text-center">
        <p className="text-sm text-muted-foreground mb-3">Was this guide helpful?</p>
        <a
          href="mailto:support@dinaya.lk"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <Icon name="envelope" />
          Tell us at support@dinaya.lk
        </a>
      </section>
    </article>
  );
}
