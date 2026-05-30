import { referencesBySlug } from "@content/docs/reference";
import { renderReferenceMarkdown } from "@/lib/docs/markdown";

export const dynamic = "force-static";

type Ctx = {
  params: Promise<{ slug: string }>;
};

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const reference = referencesBySlug[slug];

  if (!reference) {
    return new Response("Reference not found.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(renderReferenceMarkdown(reference), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}

