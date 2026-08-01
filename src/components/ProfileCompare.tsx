"use client";

import type { SavedProfile } from "@/lib/profiles";
import type { OverlayCombination } from "@/lib/severity/combine-profiles";

export type CompareView = OverlayCombination | "side-by-side";

interface Props {
  profiles: SavedProfile[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
  view: CompareView;
  onViewChange: (view: CompareView) => void;
}

const VIEWS: Array<{ value: CompareView; label: string }> = [
  { value: "max", label: "Worst-case" },
  { value: "noisy-or", label: "Noisy-OR" },
  { value: "side-by-side", label: "Side-by-side" },
];

/**
 * v3: compare 2+ saved profiles on the map at once. Per explicit user
 * direction, all three combination philosophies are offered as switchable
 * tabs rather than picking one fixed default -- worst-case (max) or a
 * noisy-OR extension of the same independent-risk math already used within
 * one profile blend two profiles into one gradient (see
 * lib/severity/combine-profiles.ts); side-by-side skips combination math
 * entirely and just renders two independent maps (capped to the first 2
 * selected -- see MapView).
 */
export function ProfileCompare({ profiles, selectedIds, onToggle, view, onViewChange }: Props) {
  const selectedCount = selectedIds.size;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">Compare profiles</h3>
      {profiles.length < 2 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Save at least 2 profiles above to compare them on the map together.
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-1">
            {profiles.map((profile) => (
              <li key={profile.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`compare-${profile.id}`}
                  checked={selectedIds.has(profile.id)}
                  onChange={() => onToggle(profile.id)}
                />
                <label htmlFor={`compare-${profile.id}`} className="text-xs text-zinc-700 dark:text-zinc-300">
                  {profile.name}
                </label>
              </li>
            ))}
          </ul>

          {selectedCount >= 2 && (
            <div
              role="tablist"
              aria-label="Compare view"
              className="flex gap-1 rounded-md border border-zinc-200 p-0.5 dark:border-zinc-800"
            >
              {VIEWS.map((option) => {
                const disabled = option.value === "side-by-side" && selectedCount > 2;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="tab"
                    aria-selected={view === option.value}
                    disabled={disabled}
                    title={
                      disabled
                        ? "Side-by-side compares exactly 2 profiles -- uncheck one to use it"
                        : undefined
                    }
                    onClick={() => onViewChange(option.value)}
                    className={`flex-1 rounded px-2 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                      view === option.value
                        ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                        : "text-zinc-600 dark:text-zinc-400"
                    }`}
                  >
                    {option.label}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
