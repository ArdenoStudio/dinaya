const GUIDE_PAGE_RE = /^\/docs\/guides\/([^/]+)$/;
const GUIDE_MARKDOWN_RE = /^\/docs\/guides\/([^/]+)\.md$/;
const REFERENCE_PAGE_RE = /^\/docs\/reference\/([^/]+)$/;
const REFERENCE_MARKDOWN_RE = /^\/docs\/reference\/([^/]+)\.md$/;

export const DOCS_HUB_PATH = "/docs";
export const DOCS_HUB_MARKDOWN_PATH = "/docs.md";
export const DOCS_HUB_INTERNAL_MARKDOWN_PATH = "/docs/markdown";

export const LLMS_PATH = "/llms";
export const LLMS_TXT_PATH = "/llms.txt";

export function getGuidePagePath(slug: string): string {
  return `/docs/guides/${slug}`;
}

export function getGuideMarkdownPath(slug: string): string {
  return `/docs/guides/${slug}.md`;
}

export function getGuideInternalMarkdownPath(slug: string): string {
  return `/docs/guides/${slug}/markdown`;
}

export function getReferencePagePath(slug: string): string {
  return `/docs/reference/${slug}`;
}

export function getReferenceMarkdownPath(slug: string): string {
  return `/docs/reference/${slug}.md`;
}

export function getReferenceInternalMarkdownPath(slug: string): string {
  return `/docs/reference/${slug}/markdown`;
}

export function getDocsMarkdownPathForPage(pathname: string): string | null {
  if (pathname === DOCS_HUB_PATH) return DOCS_HUB_MARKDOWN_PATH;

  const guideMatch = pathname.match(GUIDE_PAGE_RE);
  if (guideMatch) return getGuideMarkdownPath(guideMatch[1]);

  const referenceMatch = pathname.match(REFERENCE_PAGE_RE);
  if (referenceMatch) return getReferenceMarkdownPath(referenceMatch[1]);

  return null;
}

export function getInternalDocsMarkdownPath(pathname: string): string | null {
  if (pathname === DOCS_HUB_MARKDOWN_PATH) return DOCS_HUB_INTERNAL_MARKDOWN_PATH;
  if (pathname === LLMS_TXT_PATH) return LLMS_PATH;

  const guideMatch = pathname.match(GUIDE_MARKDOWN_RE);
  if (guideMatch) return getGuideInternalMarkdownPath(guideMatch[1]);

  const referenceMatch = pathname.match(REFERENCE_MARKDOWN_RE);
  if (referenceMatch) return getReferenceInternalMarkdownPath(referenceMatch[1]);

  return null;
}

