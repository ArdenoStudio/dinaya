"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type ThemeToggleProps = {
  className?: string;
  /** Compact icon-only control for nav chrome */
  variant?: "icon" | "pill";
};

export function ThemeToggle({ className, variant = "icon" }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  if (!mounted) {
    return (
      <span
        className={cn(
          variant === "pill"
            ? "inline-flex h-9 w-[4.5rem] rounded-full border border-gray-200 dark:border-neutral-800 bg-white dark:border-neutral-800 dark:bg-neutral-900/80"
            : "inline-flex size-9 rounded-full border border-gray-200 dark:border-neutral-800 bg-white dark:border-neutral-800 dark:bg-neutral-900/80",
          className,
        )}
        aria-hidden="true"
      />
    );
  }

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={toggleTheme}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-full border px-3 text-xs font-medium transition-colors",
          "border-gray-300 dark:border-neutral-700 bg-white/90 text-gray-700 dark:text-gray-300 hover:border-gray-400 hover:text-gray-900 dark:text-gray-100",
          "dark:border-neutral-600 dark:bg-neutral-800/90 dark:text-neutral-200 dark:hover:border-neutral-500 dark:hover:text-white",
          className,
        )}
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      >
        {isDark ? <Sun className="size-3.5" aria-hidden="true" /> : <Moon className="size-3.5" aria-hidden="true" />}
        {isDark ? "Light" : "Dark"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        "inline-flex size-9 items-center justify-center rounded-full border transition-colors",
        "border-gray-300 dark:border-neutral-700 bg-white/90 text-gray-700 dark:text-gray-300 hover:border-gray-400 hover:text-gray-900 dark:text-gray-100",
        "dark:border-neutral-600 dark:bg-neutral-800/90 dark:text-neutral-200 dark:hover:border-neutral-500 dark:hover:text-white",
        className,
      )}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun className="size-4" aria-hidden="true" /> : <Moon className="size-4" aria-hidden="true" />}
    </button>
  );
}
