"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@/components/ui/Icon";
import {
  buildDocsAiLaunchUrl,
  buildDocsAiPrompt,
  DOCS_AI_PROVIDERS,
} from "@/lib/docs/ai-actions";
import { buildAbsoluteAppUrl } from "@/lib/docs/site-url";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  summary: string;
  canonicalPath: string;
  markdownPath: string;
  className?: string;
};

async function copyText(value: string): Promise<void> {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }

  const node = document.createElement("textarea");
  node.value = value;
  node.setAttribute("readonly", "true");
  node.style.position = "fixed";
  node.style.opacity = "0";
  document.body.appendChild(node);
  node.select();
  document.execCommand("copy");
  document.body.removeChild(node);
}

export function DocsAiActions({
  title,
  summary,
  canonicalPath,
  markdownPath,
  className,
}: Props) {
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  const canonicalUrl = useMemo(() => buildAbsoluteAppUrl(canonicalPath), [canonicalPath]);
  const markdownUrl = useMemo(() => buildAbsoluteAppUrl(markdownPath), [markdownPath]);
  const prompt = useMemo(
    () => buildDocsAiPrompt({ title, summary, canonicalPath, markdownPath }),
    [title, summary, canonicalPath, markdownPath],
  );

  const showStatus = useCallback((message: string) => {
    setStatus(message);
    window.setTimeout(() => setStatus(null), 2400);
  }, []);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, []);

  const askProvider = useCallback(
    async (providerId: string) => {
      const provider = DOCS_AI_PROVIDERS.find((item) => item.id === providerId);
      if (!provider) return;

      let copied = false;
      try {
        await copyText(prompt);
        copied = true;
      } catch {
        copied = false;
      }

      const launchUrl = buildDocsAiLaunchUrl(provider, prompt);
      window.open(launchUrl, "_blank", "noopener,noreferrer");
      setOpen(false);

      if (copied) {
        showStatus(`Prompt copied. Opening ${provider.label}.`);
      } else {
        showStatus(`Opening ${provider.label}. Copy prompt manually if needed.`);
      }
    },
    [prompt, showStatus],
  );

  const copyPrompt = useCallback(async () => {
    try {
      await copyText(prompt);
      showStatus("Prompt copied.");
    } catch {
      showStatus("Could not copy prompt.");
    }
    setOpen(false);
  }, [prompt, showStatus]);

  const copyPage = useCallback(async () => {
    try {
      await copyText(canonicalUrl);
      showStatus("Page URL copied.");
    } catch {
      showStatus("Could not copy page URL.");
    }
    setOpen(false);
  }, [canonicalUrl, showStatus]);

  return (
    <div className={cn("relative", className)} ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-neutral-800 bg-white dark:border-neutral-800 dark:bg-neutral-900 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-300 shadow-sm shadow-gray-900/5 dark:shadow-black/20 transition hover:border-primary/40 hover:text-primary"
      >
        <Icon name="stars" className="text-[13px]" />
        Ask with AI
        <Icon name="chevron-right" className={cn("text-[10px] transition-transform", open ? "rotate-90" : "")} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-40 mt-2 w-[18.5rem] rounded-2xl border border-gray-200 dark:border-neutral-800 bg-white dark:border-neutral-800 dark:bg-neutral-900/95 p-2 shadow-xl shadow-gray-900/15 backdrop-blur"
        >
          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Utilities
          </p>
          <div className="mb-2 space-y-1">
            <button
              type="button"
              role="menuitem"
              onClick={copyPage}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-neutral-900/60"
            >
              <Icon name="link-45deg" className="text-[13px]" />
              Copy page URL
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={copyPrompt}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-neutral-900/60"
            >
              <Icon name="clipboard" className="text-[13px]" />
              Copy AI prompt
            </button>
            <a
              href={markdownUrl}
              role="menuitem"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-neutral-900/60"
              onClick={() => setOpen(false)}
            >
              <Icon name="book-half" className="text-[13px]" />
              View as Markdown
            </a>
          </div>

          <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
            Ask providers
          </p>
          <div className="space-y-1">
            {DOCS_AI_PROVIDERS.map((provider) => (
              <button
                key={provider.id}
                type="button"
                role="menuitem"
                onClick={() => askProvider(provider.id)}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-neutral-900/60"
              >
                <span className="inline-flex items-center gap-2">
                  <Icon name="chat-dots" className="text-[13px]" />
                  {provider.label}
                </span>
                <Icon name="arrow-up-right" className="text-[12px] text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500" />
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {status ? (
        <p className="absolute -bottom-8 right-0 whitespace-nowrap text-xs font-medium text-muted-foreground">
          {status}
        </p>
      ) : null}
    </div>
  );
}
