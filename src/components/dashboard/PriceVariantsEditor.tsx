"use client";

import type { ServicePriceVariant } from "@/lib/service-variants";
import { MAX_PRICE_VARIANTS } from "@/lib/service-variants";

interface Props {
  value: ServicePriceVariant[];
  onChange: (variants: ServicePriceVariant[]) => void;
}

function newId(): string {
  // Browser-only component, so crypto.randomUUID is available.
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `v_${Math.round(performance.now() * 1000)}`;
}

const inputCls =
  "w-full border rounded-md px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-primary";

export function PriceVariantsEditor({ value, onChange }: Props) {
  const variants = value ?? [];

  function update(index: number, patch: Partial<ServicePriceVariant>) {
    onChange(variants.map((v, i) => (i === index ? { ...v, ...patch } : v)));
  }

  function remove(index: number) {
    onChange(variants.filter((_, i) => i !== index));
  }

  function move(index: number, dir: -1 | 1) {
    const target = index + dir;
    if (target < 0 || target >= variants.length) return;
    const next = [...variants];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  function add() {
    if (variants.length >= MAX_PRICE_VARIANTS) return;
    onChange([...variants, { id: newId(), label: "", priceLkr: 0 }]);
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-sm font-medium">Price options</label>
        <p className="text-xs text-muted-foreground">
          Add options if this service is priced differently depending on the product used
          (e.g. &ldquo;Rica White Chocolate wax&rdquo; vs &ldquo;Bruhza Gold wax&rdquo;). Leave empty for a single fixed price.
        </p>
      </div>

      {variants.length > 0 && (
        <ul className="space-y-2">
          {variants.map((v, index) => (
            <li key={v.id} className="flex items-start gap-2 rounded-lg border bg-muted/30 p-3">
              <div className="grid min-w-0 flex-1 grid-cols-[1fr_auto] gap-2">
                <input
                  value={v.label}
                  onChange={(e) => update(index, { label: e.target.value })}
                  placeholder="Option name (e.g. Rica White Chocolate wax)"
                  className={inputCls}
                />
                <input
                  type="number"
                  min={0}
                  value={v.priceLkr}
                  onChange={(e) => update(index, { priceLkr: parseInt(e.target.value, 10) || 0 })}
                  placeholder="Price (LKR)"
                  className={`${inputCls} w-32`}
                />
              </div>
              <div className="flex shrink-0 flex-col">
                <button
                  type="button"
                  aria-label="Move up"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="px-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  ▲
                </button>
                <button
                  type="button"
                  aria-label="Move down"
                  onClick={() => move(index, 1)}
                  disabled={index === variants.length - 1}
                  className="px-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  ▼
                </button>
              </div>
              <button
                type="button"
                aria-label="Remove option"
                onClick={() => remove(index)}
                className="shrink-0 px-2 py-1 text-xs text-destructive hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      {variants.length < MAX_PRICE_VARIANTS && (
        <button type="button" onClick={add} className="text-sm text-primary hover:underline">
          + Add a price option
        </button>
      )}
    </div>
  );
}
