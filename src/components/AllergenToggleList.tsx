"use client";

import { ALLERGENS } from "@/lib/allergens/registry";

interface Props {
  active: Set<string>;
  onToggle: (allergenId: string) => void;
}

/**
 * Renders one toggle per entry in the allergen registry — never a hardcoded
 * per-allergen component. Adding an allergen to the registry (story s4) produces a
 * new toggle here with zero changes to this file; that's the acceptance test for
 * story s2's architecture requirement.
 */
export function AllergenToggleList({ active, onToggle }: Props) {
  return (
    <fieldset className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
      <legend className="px-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Allergens
      </legend>
      {ALLERGENS.map((allergen) => (
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
  );
}
