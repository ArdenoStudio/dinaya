import { renderLlmsTxt } from "@/lib/docs/markdown";

export const dynamic = "force-static";

export async function GET() {
  return new Response(renderLlmsTxt(), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=600, stale-while-revalidate=86400",
    },
  });
}

