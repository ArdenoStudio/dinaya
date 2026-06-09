import { notFound } from "next/navigation";
import { DocsPhoneFrame } from "@/components/docs/DocsPhoneFrame";
import { DocsProductFrame } from "@/components/docs/DocsProductFrame";
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

export default async function DocsPreviewPage({ params }: Props) {
  const { mockupId } = await params;
  if (!isPreviewMockupId(mockupId)) notFound();

  return (
    <div data-docs-capture-root className="inline-block bg-white p-4">
      {mockupId.startsWith("booking-") ? (
        <DocsPhoneFrame mockupId={mockupId} scale={0.85} />
      ) : (
        <DocsProductFrame mockupId={mockupId} />
      )}
    </div>
  );
}
