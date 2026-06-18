#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const fixes = [
  [/dark:bg-amber-950\/40\/70/g, "dark:bg-amber-950/40"],
  [/dark:bg-amber-950\/40\/50/g, "dark:bg-amber-950/40"],
  [/dark:bg-amber-950\/400\/20/g, "dark:bg-amber-950/30"],
  [/dark:bg-amber-950\/400\/15/g, "dark:bg-amber-950/30"],
  [/dark:bg-amber-950\/400\/10/g, "dark:bg-amber-950/30"],
  [/dark:bg-blue-950\/40\/70/g, "dark:bg-blue-950/40"],
  [/dark:bg-blue-950\/40\/50/g, "dark:bg-blue-950/40"],
  [/dark:bg-emerald-950\/40\/70/g, "dark:bg-emerald-950/40"],
  [/dark:bg-emerald-950\/400\/20/g, "dark:bg-emerald-950/30"],
  [/dark:bg-emerald-950\/400\/15/g, "dark:bg-emerald-950/30"],
  [/dark:bg-emerald-950\/400\/10/g, "dark:bg-emerald-950/30"],
  [/dark:bg-rose-950\/400\/10/g, "dark:bg-rose-950/30"],
  [/dark:bg-rose-950\/40\/40/g, "dark:bg-rose-950/40"],
  [/dark:bg-rose-950\/40\/50/g, "dark:bg-rose-950/40"],
  [/dark:bg-neutral-900\/600\/5/g, "dark:bg-neutral-900/60"],
  [/dark:bg-amber-950\/40\/60 dark:bg-amber-950\/35/g, "dark:bg-amber-950/35"],
  [/dark:bg-amber-950\/40\/60/g, "dark:bg-amber-950/40"],
  [/dark:bg-blue-950\/40\/60/g, "dark:bg-blue-950/40"],
  [/dark:bg-emerald-950\/40\/60/g, "dark:bg-emerald-950/40"],
  [/dark:bg-neutral-900\/60\/90/g, "dark:bg-neutral-900/90"],
  [/dark:bg-neutral-900\/60\/80/g, "dark:bg-neutral-900/60"],
  [/dark:bg-neutral-900\/60\/40/g, "dark:bg-neutral-900/60"],
  [/dark:bg-neutral-900\/60\/30/g, "dark:bg-neutral-900/60"],
  [/dark:bg-neutral-950\/90-md/g, "dark:bg-neutral-950/90 md:"],
  [/dark:text-gray-400 dark:text-gray-500 dark:text-gray-400 dark:text-gray-500/g, "dark:text-gray-400"],
  [/dark:border-neutral-800 dark:border-neutral-800/g, "dark:border-neutral-800"],
  [/dark:bg-(amber|blue|emerald)-950\/40\/\d+ dark:bg-\1-950\/40/g, "dark:bg-$1-950/40"],
  [/dark:bg-amber-950\/40 dark:bg-amber-950\/40/g, "dark:bg-amber-950/40"],
  [/dark:bg-blue-950\/40 dark:bg-blue-950\/40/g, "dark:bg-blue-950/40"],
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "node_modules" || entry.name === ".next") continue;
      walk(full, files);
    } else if (/\.(tsx|ts|css)$/.test(entry.name)) {
      files.push(full);
    }
  }
  return files;
}

let changed = 0;
for (const file of walk(path.resolve("src"))) {
  const original = fs.readFileSync(file, "utf8");
  let next = original;
  for (const [pattern, replacement] of fixes) {
    next = next.replace(pattern, replacement);
  }
  if (next !== original) {
    fs.writeFileSync(file, next);
    changed += 1;
  }
}

console.log(`Fixed chained dark classes in ${changed} files.`);
