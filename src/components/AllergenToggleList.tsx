"use client";

import { useMemo } from "react";
import { ALLERGENS, type AllergenCategory } from "@/lib/allergens/registry";

interface Props {
  active: Set<string>;
  onToggle: (allergenId: string) => void;
}

const CATEGORY_LABELS: Record<AllergenCategory, string> = {
  grass: "Grasses",
  weed: "Weeds",
  tree: "Trees",
  mold: "Mold",
};

const CATEGORY_ORDER: AllergenCategory[] = ["grass", "weed", "tree", "mold"];

/**
 * Renders one toggle per entry in the allergen registry, grouped by category —
 * never a hardcoded per-allergen component. Adding an allergen to the registry
 * (or a whole new category) produces a new toggle/group here with zero changes to
 * this file; that's the acceptance test for story s2/s4's architecture requirement.
 */
export function AllergenToggleList({ active, onToggle }: Props) {
  const grouped = useMemo(() => {
    const byCategory = new Map<AllergenCategory, typeof ALLERGENS>();
    for (const allergen of ALLERGENS) {
      const list = byCategory.get(allergen.category) ?? [];
      list.push(allergen);
      byCategory.set(allergen.category, list);
    }
    return byCategory;
  }, []);

  return (
    <div className="flex max-h-[32rem] flex-col gap-4 overflow-y-auto rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      {CATEGORY_ORDER.filter((category) => grouped.has(category)).map((category) => (
        <fieldset key={category} className="flex flex-col gap-1.5">
          <legend className="px-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {CATEGORY_LABELS[category]}
          </legend>
          {(grouped.get(category) ?? []).map((allergen) => (
            <label
              key={allergen.id}
              className="flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200"
            >
              <input
                type="checkbox"
                checked={active.has(allergen.id)}
                onChange={() => onToggle(allergen.id)}
                className="h-4 w-4"
              />
              <span
                className="inline-block h-3 w-3 rounded-full"
                style={{ backgroundColor: allergen.color }}
                aria-hidden
              />
              {allergen.label}
              {allergen.confidence === "modeled" && (
                <span className="text-xs text-zinc-400">(modeled)</span>
              )}
            </label>
          ))}
        </fieldset>
      ))}
    </div>
  );
}
