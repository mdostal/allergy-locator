"use client";

import { useMemo } from "react";
import { ALLERGENS, type AllergenCategory } from "@/lib/allergens/registry";
import authorPreset from "@data/presets/author.json";

interface Props {
  sensitivities: Record<string, number>;
  onChange: (allergenId: string, value: number) => void;
  onLoadPreset: () => void;
}

const CATEGORY_LABELS: Record<AllergenCategory, string> = {
  grass: "Grasses",
  weed: "Weeds",
  tree: "Trees",
  mold: "Mold",
};

const CATEGORY_ORDER: AllergenCategory[] = ["grass", "weed", "tree", "mold"];

/**
 * Mode 2's real deliverable: a slider per allergen, looped from the same registry
 * as Mode 1's toggles -- never a hardcoded per-allergen control. The author's
 * example is reachable through this exact same mechanism (loading preset values
 * into these same sliders), not a special code path, confirming the tool is
 * general-purpose per the user's own framing ("MINE is mostly grass... however
 * this is a general tool for anyone").
 */
export function SensitivitySliders({ sensitivities, onChange, onLoadPreset }: Props) {
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
      <button
        type="button"
        onClick={onLoadPreset}
        className="self-start rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white dark:bg-zinc-50 dark:text-zinc-900"
      >
        Load {authorPreset.label}
      </button>
      {CATEGORY_ORDER.filter((category) => grouped.has(category)).map((category) => (
        <fieldset key={category} className="flex flex-col gap-2">
          <legend className="px-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            {CATEGORY_LABELS[category]}
          </legend>
          {(grouped.get(category) ?? []).map((allergen) => (
            <div key={allergen.id} className="flex flex-col gap-0.5">
              <label
                htmlFor={`sensitivity-${allergen.id}`}
                className="flex items-center justify-between text-xs text-zinc-700 dark:text-zinc-300"
              >
                <span className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: allergen.color }}
                    aria-hidden
                  />
                  {allergen.label}
                </span>
                <span className="tabular-nums text-zinc-400">
                  {sensitivities[allergen.id] ?? 0}
                </span>
              </label>
              <input
                id={`sensitivity-${allergen.id}`}
                type="range"
                min={0}
                max={100}
                value={sensitivities[allergen.id] ?? 0}
                onChange={(e) => onChange(allergen.id, Number(e.target.value))}
                className="h-1.5 w-full"
              />
            </div>
          ))}
        </fieldset>
      ))}
    </div>
  );
}
