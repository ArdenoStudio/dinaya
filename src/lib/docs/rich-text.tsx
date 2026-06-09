import Link from "next/link";

type Segment =
  | { type: "text"; value: string }
  | { type: "bold"; value: string }
  | { type: "code"; value: string }
  | { type: "link"; label: string; href: string };

const INLINE_PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

function parseInlineMarkdown(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, index) });
    }

    const token = match[0];
    if (token.startsWith("**") && token.endsWith("**")) {
      segments.push({ type: "bold", value: token.slice(2, -2) });
    } else if (token.startsWith("`") && token.endsWith("`")) {
      segments.push({ type: "code", value: token.slice(1, -1) });
    } else if (token.startsWith("[")) {
      const linkMatch = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(token);
      if (linkMatch) {
        segments.push({ type: "link", label: linkMatch[1], href: linkMatch[2] });
      } else {
        segments.push({ type: "text", value: token });
      }
    } else {
      segments.push({ type: "text", value: token });
    }

    lastIndex = index + token.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: text }];
}

function renderSegment(segment: Segment, key: number) {
  switch (segment.type) {
    case "bold":
      return (
        <strong key={key} className="font-semibold text-gray-900">
          {segment.value}
        </strong>
      );
    case "code":
      return (
        <code
          key={key}
          className="rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-[0.85em] text-gray-800"
        >
          {segment.value}
        </code>
      );
    case "link": {
      const isExternal = segment.href.startsWith("http");
      if (isExternal) {
        return (
          <a
            key={key}
            href={segment.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
          >
            {segment.label}
          </a>
        );
      }
      return (
        <Link
          key={key}
          href={segment.href}
          className="font-medium text-primary underline decoration-primary/30 underline-offset-2 hover:decoration-primary"
        >
          {segment.label}
        </Link>
      );
    }
    default:
      return <span key={key}>{segment.value}</span>;
  }
}

type Props = {
  text: string;
  className?: string;
};

/** Lightweight inline markdown: **bold**, `code`, [links](url). */
export function DocsRichText({ text, className }: Props) {
  const lines = text.split("\n");

  return (
    <div className={className}>
      {lines.map((line, lineIndex) => {
        const segments = parseInlineMarkdown(line);
        return (
          <p key={lineIndex} className={lineIndex > 0 ? "mt-3" : undefined}>
            {segments.map((segment, i) => renderSegment(segment, i))}
          </p>
        );
      })}
    </div>
  );
}
