import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allReferences, referencesBySlug } from "@content/docs/reference";
import { DocsAiActions } from "@/components/docs/DocsAiActions";
import { getReferenceMarkdownPath, getReferencePagePath } from "@/lib/docs/paths";
import { buildAbsoluteAppUrl } from "@/lib/docs/site-url";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return allReferences.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ref = referencesBySlug[slug];
  if (!ref) return { title: "Reference not found" };
  const canonicalPath = getReferencePagePath(ref.slug);
  const markdownPath = getReferenceMarkdownPath(ref.slug);

  return {
    title: `${ref.title} — Dinaya Docs`,
    description: ref.description,
    alternates: {
      canonical: buildAbsoluteAppUrl(canonicalPath),
      types: {
        "text/markdown": buildAbsoluteAppUrl(markdownPath),
      },
    },
  };
}

export default async function ReferencePage({ params }: Props) {
  const { slug } = await params;
  const ref = referencesBySlug[slug];
  if (!ref) notFound();

  return (
    <article className="pb-16">
      <nav className="text-xs text-muted-foreground mb-6">
        <Link href="/docs" className="hover:text-foreground">
          Docs
        </Link>
        <span className="mx-1">/</span>
        <span className="text-foreground">{ref.title}</span>
      </nav>
      <header className="mb-8 rounded-3xl border border-gray-200 bg-gradient-to-br from-white via-slate-50 to-blue-50/60 px-6 py-6 shadow-sm shadow-gray-900/5">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h1 className="font-cal text-3xl tracking-tight mb-2">{ref.title}</h1>
            <p className="text-sm text-muted-foreground">{ref.description}</p>
          </div>
          <DocsAiActions
            title={ref.title}
            summary={ref.description}
            canonicalPath={getReferencePagePath(ref.slug)}
            markdownPath={getReferenceMarkdownPath(ref.slug)}
          />
        </div>
      </header>
      <div className="space-y-8">
        {ref.sections.map((s) => (
          <section key={s.heading} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/5">
            <h2 className="font-cal text-lg tracking-tight mb-2">{s.heading}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </section>
        ))}
      </div>
      <p className="mt-10 text-sm">
        <Link href="/pricing" className="text-primary font-medium hover:underline">
          Compare plans on pricing →
        </Link>
      </p>
    </article>
  );
}
