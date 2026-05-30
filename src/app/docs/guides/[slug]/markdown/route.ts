import { guidesBySlug } from "@content/docs/guides";
import { renderGuideMarkdown } from "@/lib/docs/markdown";

export const dynamic = "force-static";

type Ctx = {
  params: Promise<{ slug: string }>;
};

export async function GET(_req: Request, { params }: Ctx) {
  const { slug } = await params;
  const guide = guidesBySlug[slug];

  if (!guide) {
    return new Response("Guide not found.", {
      status: 404,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new Response(renderGuideMarkdown(guide), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}

