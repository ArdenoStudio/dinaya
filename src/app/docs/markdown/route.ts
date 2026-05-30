import { renderDocsHubMarkdown } from "@/lib/docs/markdown";

export const dynamic = "force-static";

export async function GET() {
  return new Response(renderDocsHubMarkdown(), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}

