import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { allReferences, referencesBySlug } from "@content/docs/reference";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return allReferences.map((r) => ({ slug: r.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const ref = referencesBySlug[slug];
  if (!ref) return { title: "Reference not found" };
  return { title: `${ref.title} — Dinaya Docs`, description: ref.description };
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
      <h1 className="font-cal text-3xl tracking-tight mb-2">{ref.title}</h1>
      <p className="text-sm text-muted-foreground mb-8">{ref.description}</p>
      <div className="space-y-8">
        {ref.sections.map((s) => (
          <section key={s.heading}>
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
