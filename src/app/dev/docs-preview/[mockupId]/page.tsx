import { notFound } from "next/navigation";
import { DocsMockupCapture } from "@/components/docs/DocsMockupCapture";
import {
  DOCS_PREVIEW_MOCKUP_IDS,
  type DocsPreviewMockupId,
} from "@/lib/docs/visuals";

type Props = { params: Promise<{ mockupId: string }> };

export function generateStaticParams() {
  return DOCS_PREVIEW_MOCKUP_IDS.map((mockupId) => ({ mockupId }));
}

function isPreviewMockupId(value: string): value is DocsPreviewMockupId {
  return (DOCS_PREVIEW_MOCKUP_IDS as readonly string[]).includes(value);
}

/** Bare capture surface — no docs hub chrome. */
export default async function DevDocsPreviewPage({ params }: Props) {
  const { mockupId } = await params;
  if (!isPreviewMockupId(mockupId)) notFound();

  return (
    <div className="min-h-screen bg-[hsl(240_8%_96%)] p-8 dark:bg-[hsl(240_5%_8%)]">
      <div data-docs-capture-root className="inline-block">
        <DocsMockupCapture mockupId={mockupId} scale={0.9} />
      </div>
    </div>
  );
}
