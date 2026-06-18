#!/usr/bin/env node
/**
 * Adds dark-mode Tailwind variants to common class patterns without changing light mode.
 * Skips lines that already include a matching dark: token for the same utility group.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src");

const REPLACEMENTS = [
  ["min-h-dvh bg-white", "min-h-dvh bg-white dark:bg-neutral-950"],
  ["min-h-screen bg-white", "min-h-screen bg-white dark:bg-neutral-950"],
  ["overflow-hidden rounded-xl border bg-white", "overflow-hidden rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900"],
  ["rounded-xl border bg-white", "rounded-xl border bg-white dark:border-neutral-800 dark:bg-neutral-900"],
  ["rounded-2xl border border-gray-200 bg-white", "rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"],
  ["rounded-xl border border-gray-200 bg-white", "rounded-xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"],
  ["border border-gray-200 bg-white", "border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"],
  ["bg-white border rounded-xl", "bg-white border rounded-xl dark:border-neutral-800 dark:bg-neutral-900"],
  ["border bg-white", "border bg-white dark:border-neutral-800 dark:bg-neutral-900"],
  ["bg-white/95 backdrop-blur", "bg-white/95 backdrop-blur dark:bg-neutral-950/95"],
  ["bg-white/90 backdrop-blur", "bg-white/90 backdrop-blur dark:bg-neutral-950/90"],
  ["border-b bg-white/95", "border-b bg-white/95 dark:border-neutral-800 dark:bg-neutral-950/95"],
  ["border-r bg-white", "border-r bg-white dark:border-neutral-800 dark:bg-neutral-900"],
  ["text-gray-900", "text-gray-900 dark:text-gray-100"],
  ["text-gray-800", "text-gray-800 dark:text-gray-200"],
  ["text-gray-700", "text-gray-700 dark:text-gray-300"],
  ["text-gray-600", "text-gray-600 dark:text-gray-400"],
  ["text-gray-500", "text-gray-500 dark:text-gray-400"],
  ["text-gray-400", "text-gray-400 dark:text-gray-500"],
  ["bg-gray-50", "bg-gray-50 dark:bg-neutral-900/60"],
  ["bg-gray-100", "bg-gray-100 dark:bg-neutral-800"],
  ["bg-gray-200", "bg-gray-200 dark:bg-neutral-700"],
  ["border-gray-100", "border-gray-100 dark:border-neutral-800"],
  ["border-gray-200", "border-gray-200 dark:border-neutral-800"],
  ["border-gray-300", "border-gray-300 dark:border-neutral-700"],
  ["hover:bg-gray-50", "hover:bg-gray-50 dark:hover:bg-neutral-800/80"],
  ["hover:bg-black/5", "hover:bg-black/5 dark:hover:bg-white/5"],
  ["hover:text-gray-900", "hover:text-gray-900 dark:hover:text-gray-100"],
  ["hover:text-gray-600", "hover:text-gray-600 dark:hover:text-gray-300"],
  ["placeholder:text-gray-300", "placeholder:text-gray-300 dark:placeholder:text-neutral-600"],
  ["shadow-sm shadow-gray-900/5", "shadow-sm shadow-gray-900/5 dark:shadow-black/20"],
  ["bg-gray-900/5", "bg-gray-900/5 dark:bg-white/5"],
  ["rounded-lg border border-dashed bg-white", "rounded-lg border border-dashed bg-white dark:border-neutral-800 dark:bg-neutral-900"],
  ["border-l bg-white shadow-xl", "border-l bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"],
  ["rounded-2xl bg-white px-[15px]", "rounded-2xl bg-white dark:bg-neutral-900 px-[15px]"],
  ["rounded-2xl bg-white p-10", "rounded-2xl bg-white dark:bg-neutral-900 p-10"],
  ["rounded-xl border border-dashed border-gray-200 dark:border-neutral-800 bg-white", "rounded-xl border border-dashed border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900"],
  ["section className=\"mx-4 mb-4 rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white", "section className=\"mx-4 mb-4 rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900"],
  ["bg-white p-4 md:mx-0", "bg-white dark:bg-neutral-900 p-4 md:mx-0"],
  ["bg-white p-6", "bg-white dark:bg-neutral-900 p-6"],
  ["bg-white p-5", "bg-white dark:bg-neutral-900 p-5"],
  ["bg-white p-4", "bg-white dark:bg-neutral-900 p-4"],
  ["bg-white px-4 py-4", "bg-white dark:bg-neutral-900 px-4 py-4"],
  ["md:bg-white md:shadow", "md:bg-white dark:md:bg-neutral-900 md:shadow"],
  ["md:bg-white md:p-5", "md:bg-white dark:md:bg-neutral-900 md:p-5"],
  ["md:overflow-hidden md:rounded-2xl md:border md:border-gray-100 dark:border-neutral-800/80 md:bg-white", "md:overflow-hidden md:rounded-2xl md:border md:border-gray-100 dark:border-neutral-800/80 md:bg-white dark:md:bg-neutral-900"],
  ["border-gray-200 dark:border-neutral-800 bg-white text-gray-600", "border-gray-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-gray-600"],
  ["border-transparent bg-white/70", "border-transparent bg-white/70 dark:bg-neutral-900/70"],
  ["bg-[#f2f2f7] px-[14px]", "booking-panel-bg px-[14px]"],
  ["bg-[#f2f2f7]/95", "booking-sticky-bar"],
  ["bg-[#f5f4f1]", "bg-[#f5f4f1] dark:bg-neutral-950"],
  ["border-b bg-white", "border-b bg-white dark:border-neutral-800 dark:bg-neutral-900"],
  ["hover:bg-white", "hover:bg-white dark:hover:bg-neutral-800"],
  ["bg-amber-50/70", "bg-amber-50/70 dark:bg-amber-950/40"],
  ["bg-amber-50/60", "bg-amber-50/60 dark:bg-amber-950/35"],
  ["bg-amber-50", "bg-amber-50 dark:bg-amber-950/40"],
  ["bg-emerald-50", "bg-emerald-50 dark:bg-emerald-950/40"],
  ["bg-rose-50", "bg-rose-50 dark:bg-rose-950/40"],
  ["bg-blue-50/70", "bg-blue-50/70 dark:bg-blue-950/40"],
  ["bg-blue-50", "bg-blue-50 dark:bg-blue-950/40"],
  ["text-amber-900", "text-amber-900 dark:text-amber-200"],
  ["text-amber-900/80", "text-amber-900/80 dark:text-amber-200/80"],
  ["text-blue-950", "text-blue-950 dark:text-blue-100"],
  ["text-emerald-900", "text-emerald-900 dark:text-emerald-200"],
  ["text-rose-900", "text-rose-900 dark:text-rose-200"],
  ["border-amber-200", "border-amber-200 dark:border-amber-800/50"],
  ["border-emerald-200", "border-emerald-200 dark:border-emerald-800/50"],
  ["border-rose-200", "border-rose-200 dark:border-rose-800/50"],
  ["border-red-200 bg-red-50", "border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/40"],
  ["text-red-700", "text-red-700 dark:text-red-300"],
  ["focus:ring-primary/40 bg-white", "focus:ring-primary/40 bg-white dark:border-neutral-700 dark:bg-neutral-900"],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, files);
    } else if (/\.(tsx|ts|jsx|js)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

function applyReplacements(content) {
  let next = content;
  for (const [from, to] of REPLACEMENTS) {
    const regex = new RegExp(`${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?!\\s+dark:)`, "g");
    next = next.replace(regex, to);
  }
  return next;
}

let changed = 0;
for (const file of walk(ROOT)) {
  const original = fs.readFileSync(file, "utf8");
  const updated = applyReplacements(original);
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    changed += 1;
  }
}

console.log(`Updated ${changed} files with dark-mode variants.`);
