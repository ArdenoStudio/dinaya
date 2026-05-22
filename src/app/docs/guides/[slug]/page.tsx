import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Icon } from "@/components/ui/Icon";
import { guidesBySlug, allGuides } from "@content/docs/guides";
import { getCategoryLabel } from "@content/docs/categories";
import { UiWalkthrough } from "@/components/docs/UiWalkthrough";
import { PlanBadge } from "@/components/docs/PlanBadge";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return allGuides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = guidesBySlug[slug];
  if (!guide) return { title: "Guide not found" };
  return {
    title: `${guide.title} — Dinaya Docs`,
    description: guide.description,
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

      <header className="mb-10">
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {guide.planRequired ? <PlanBadge plan={guide.planRequired} /> : null}
          <span className="text-xs text-muted-foreground">
            {guide.estimatedMinutes} min read · {guide.steps.length} steps
          </span>
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
        <section className="mt-14 border-t pt-10">
          <h2 className="font-cal text-lg tracking-tight mb-4">Related guides</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {related.map((r) => (
              <li key={r.slug}>
                <Link
                  href={`/docs/guides/${r.slug}`}
                  className="block rounded-xl border p-4 hover:border-primary/30 text-sm"
                >
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="mt-10 rounded-2xl border bg-gray-50 p-6 text-center">
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
