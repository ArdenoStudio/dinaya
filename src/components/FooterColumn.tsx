"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { Icon } from "@/components/ui/Icon";

export type FooterLink = { label: string; href: string };

/**
 * Footer link group. On mobile it's a tap-to-expand accordion (collapsed by
 * default) so the stacked footer stays short; from `md` up it's a plain,
 * always-open column — identical to the original static markup.
 */
export function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: readonly FooterLink[];
}) {
  const [open, setOpen] = useState(false);
  const listId = useId();

  return (
    <div className="border-b border-white/10 md:border-0">
      <h3 className="font-cal text-xs tracking-widest uppercase text-gray-500 md:mb-6">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={listId}
          className="flex w-full items-center justify-between py-4 md:pointer-events-none md:py-0"
        >
          {title}
          <Icon
            name="chevron-down"
            className={`text-gray-500 transition-transform duration-200 md:hidden ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h3>
      <ul
        id={listId}
        className={`flex-col gap-4 text-sm md:flex md:pb-0 ${open ? "flex pb-5" : "hidden"}`}
      >
        {links.map(({ label, href }) => (
          <li key={href}>
            <Link href={href} className="text-gray-400 hover:text-white transition-colors">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
