import { notFound } from "next/navigation";
import { DocsMockupCapture } from "@/components/docs/DocsMockupCapture";
import { DocsBookingMockup } from "@/components/docs/mockups/DocsBookingMockup";
import {
  DOCS_PREVIEW_MOCKUP_IDS,
  type DocsPreviewMockupId,
} from "@/lib/docs/visuals";

type Props = {
  params: Promise<{ mockupId: string }>;
  searchParams: Promise<{ screenOnly?: string }>;
};

export function generateStaticParams() {
  return DOCS_PREVIEW_MOCKUP_IDS.map((mockupId) => ({ mockupId }));
}

function isPreviewMockupId(value: string): value is DocsPreviewMockupId {
  return (DOCS_PREVIEW_MOCKUP_IDS as readonly string[]).includes(value);
}

/** Bare capture surface — no docs hub chrome. */
export default async function DevDocsPreviewPage({ params, searchParams }: Props) {
  const { mockupId } = await params;
  const { screenOnly } = await searchParams;
  if (!isPreviewMockupId(mockupId)) notFound();

  // Screen-only booking frames for PNG capture (DocsPhoneFrame adds the bezel in guides).
  if (screenOnly === "1" && mockupId.startsWith("booking-")) {
    return (
      <div className="min-h-screen bg-white p-0">
        <div
          data-docs-capture-root
          className="relative h-[844px] w-[390px] overflow-hidden bg-white"
        >
          <DocsBookingMockup variant={mockupId} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(240_8%_96%)] p-8 dark:bg-[hsl(240_5%_8%)]">
      <div data-docs-capture-root className="inline-block">
        <DocsMockupCapture mockupId={mockupId} scale={0.9} />
      </div>
    </div>
  );
}
