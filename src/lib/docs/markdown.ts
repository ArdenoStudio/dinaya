import { docsCategories, getCategoryLabel } from "@content/docs/categories";
import { allGuides } from "@content/docs/guides";
import { allReferences } from "@content/docs/reference";
import type { DocsGuide, ReferencePage } from "@content/docs/types";
import {
  DOCS_HUB_MARKDOWN_PATH,
  DOCS_HUB_PATH,
  getGuideMarkdownPath,
  getGuidePagePath,
  getReferenceMarkdownPath,
  getReferencePagePath,
} from "@/lib/docs/paths";
import { buildAbsoluteAppUrl } from "@/lib/docs/site-url";

function clean(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function section(title: string, lines: string[]): string {
  return [`## ${title}`, ...lines, ""].join("\n");
}

export function renderDocsHubMarkdown(): string {
  const lines: string[] = [];
  lines.push("# Dinaya Documentation");
  lines.push("");
  lines.push("Step-by-step guides for bookings, payments, operations, and growth.");
  lines.push("");
  lines.push(`Canonical: ${buildAbsoluteAppUrl(DOCS_HUB_PATH)}`);
  lines.push(`Markdown: ${buildAbsoluteAppUrl(DOCS_HUB_MARKDOWN_PATH)}`);
  lines.push("");
  lines.push("## Guides");
  lines.push("");

  for (const guide of allGuides) {
    const pageUrl = buildAbsoluteAppUrl(getGuidePagePath(guide.slug));
    const markdownUrl = buildAbsoluteAppUrl(getGuideMarkdownPath(guide.slug));
    lines.push(`- ${guide.title}`);
    lines.push(`  - Category: ${getCategoryLabel(guide.category)}`);
    lines.push(`  - Summary: ${clean(guide.description)}`);
    lines.push(`  - Read: ${pageUrl}`);
    lines.push(`  - Markdown: ${markdownUrl}`);
  }

  lines.push("");
  lines.push("## References");
  lines.push("");
  for (const reference of allReferences) {
    lines.push(`- ${reference.title}`);
    lines.push(`  - Read: ${buildAbsoluteAppUrl(getReferencePagePath(reference.slug))}`);
    lines.push(
      `  - Markdown: ${buildAbsoluteAppUrl(getReferenceMarkdownPath(reference.slug))}`,
    );
  }

  lines.push("");
  lines.push("## Categories");
  lines.push("");
  for (const category of docsCategories) {
    lines.push(`- ${category.label}: ${clean(category.description)}`);
  }

  return lines.join("\n");
}

export function renderGuideMarkdown(guide: DocsGuide): string {
  const lines: string[] = [];
  lines.push(`# ${guide.title}`);
  lines.push("");
  lines.push(clean(guide.description));
  lines.push("");
  lines.push(`Category: ${getCategoryLabel(guide.category)}`);
  lines.push(`Estimated time: ${guide.estimatedMinutes} min`);
  if (guide.planRequired) {
    lines.push(`Plan required: ${guide.planRequired}`);
  }
  lines.push(`Canonical: ${buildAbsoluteAppUrl(getGuidePagePath(guide.slug))}`);
  lines.push(`Markdown: ${buildAbsoluteAppUrl(getGuideMarkdownPath(guide.slug))}`);
  lines.push("");
  lines.push("## Steps");
  lines.push("");

  for (let index = 0; index < guide.steps.length; index += 1) {
    const step = guide.steps[index];
    lines.push(`### ${index + 1}. ${step.title}`);
    lines.push("");
    lines.push(clean(step.body));
    lines.push("");

    if (step.highlightNav) {
      lines.push(`- Navigation hint: ${step.highlightNav}`);
    }
    if (step.highlightTarget) {
      lines.push(`- UI target: ${step.highlightTarget}`);
    }
    if (step.hotspots && step.hotspots.length > 0) {
      lines.push(`- Hotspots: ${step.hotspots.map((hotspot) => hotspot.label ?? "highlight").join(", ")}`);
    }
    if (step.visual) {
      let visualLabel = "";
      if (step.visual.type === "mockup") {
        visualLabel = `mockup:${step.visual.mockupId}`;
      } else if (step.visual.type === "screenshot") {
        visualLabel = `screenshot:${step.visual.src}`;
      } else {
        visualLabel = `custom:${step.visual.componentId}`;
      }
      lines.push(`- Visual: ${visualLabel}`);
    }
    lines.push("");
  }

  if (guide.relatedGuides && guide.relatedGuides.length > 0) {
    lines.push(
      section(
        "Related Guides",
        guide.relatedGuides.map((slug) => `- ${buildAbsoluteAppUrl(getGuidePagePath(slug))}`),
      ),
    );
  }

  return lines.join("\n").trim();
}

export function renderReferenceMarkdown(reference: ReferencePage): string {
  const lines: string[] = [];
  lines.push(`# ${reference.title}`);
  lines.push("");
  lines.push(clean(reference.description));
  lines.push("");
  lines.push(`Canonical: ${buildAbsoluteAppUrl(getReferencePagePath(reference.slug))}`);
  lines.push(`Markdown: ${buildAbsoluteAppUrl(getReferenceMarkdownPath(reference.slug))}`);
  lines.push("");

  for (const sectionEntry of reference.sections) {
    lines.push(`## ${sectionEntry.heading}`);
    lines.push("");
    lines.push(clean(sectionEntry.body));
    lines.push("");
  }

  return lines.join("\n").trim();
}

export function renderLlmsTxt(): string {
  const lines: string[] = [];
  lines.push("# Dinaya LLM Docs Index");
  lines.push("");
  lines.push(`Docs home: ${buildAbsoluteAppUrl(DOCS_HUB_PATH)}`);
  lines.push(`Docs markdown: ${buildAbsoluteAppUrl(DOCS_HUB_MARKDOWN_PATH)}`);
  lines.push("");
  lines.push("## Guides");
  lines.push("");

  for (const guide of allGuides) {
    lines.push(
      `- ${guide.title}: ${buildAbsoluteAppUrl(getGuidePagePath(guide.slug))} | ${buildAbsoluteAppUrl(getGuideMarkdownPath(guide.slug))}`,
    );
  }

  lines.push("");
  lines.push("## Reference");
  lines.push("");

  for (const reference of allReferences) {
    lines.push(
      `- ${reference.title}: ${buildAbsoluteAppUrl(getReferencePagePath(reference.slug))} | ${buildAbsoluteAppUrl(getReferenceMarkdownPath(reference.slug))}`,
    );
  }

  return lines.join("\n");
}
