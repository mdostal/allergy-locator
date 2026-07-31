"use client";

import { useMemo } from "react";
import { BaseSvgMap } from "@/components/BaseSvgMap";
import { getAllergen } from "@/lib/allergens/registry";
import { getSeverity } from "@/lib/severity/score";
import { intensityColor } from "@/lib/severity/palette";

interface SingleMapProps {
  allergenId: string | null;
  onSelectCity: (cityId: string) => void;
  selectedCityId: string | null;
  compact?: boolean;
}

/**
 * One allergen = one sequential (magnitude) ramp, per the dataviz skill's rule.
 * This never needs to be mutually distinguishable from another allergen's ramp,
 * because when more than one is active, UsMap renders these side by side as small
 * multiples (each self-labeled), not blended into one map.
 */
function SingleAllergenMap({
  allergenId,
  onSelectCity,
  selectedCityId,
  compact,
}: SingleMapProps) {
  const allergen = allergenId ? getAllergen(allergenId) : undefined;

  return (
    <BaseSvgMap
      ariaLabel={allergen ? `${allergen.label} severity map` : "US allergen severity map"}
      onSelectCity={onSelectCity}
      selectedCityId={selectedCityId}
      compact={compact}
      colorForCity={(cityId) => {
        if (!allergenId || !allergen) return undefined;
        const severity = getSeverity(allergenId, cityId);
        return severity ? intensityColor(allergen.color, severity.value) : undefined;
      }}
      tooltipForCity={(cityId) => {
        if (!allergenId) return undefined;
        const severity = getSeverity(allergenId, cityId);
        return severity ? `${severity.tier} (${severity.value})` : undefined;
      }}
    />
  );
}

interface Props {
  active: Set<string>;
  onSelectCity: (cityId: string) => void;
  selectedCityId: string | null;
}

export function UsMap({ active, onSelectCity, selectedCityId }: Props) {
  const activeIds = useMemo(() => Array.from(active), [active]);

  if (activeIds.length <= 1) {
    return (
      <SingleAllergenMap
        allergenId={activeIds[0] ?? null}
        onSelectCity={onSelectCity}
        selectedCityId={selectedCityId}
      />
    );
  }

  // Small multiples: 2+ simultaneously active allergens render as separate,
  // individually-labeled mini-maps rather than one map trying to blend N hues --
  // per the dataviz skill, identity past a handful of series comes from labels
  // and separation, not from more mutually-distinguishable colors.
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {activeIds.map((id) => {
        const allergen = getAllergen(id);
        return (
          <div key={id} className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: allergen?.color }}
                aria-hidden
              />
              {allergen?.label ?? id}
            </div>
            <SingleAllergenMap
              allergenId={id}
              onSelectCity={onSelectCity}
              selectedCityId={selectedCityId}
              compact
            />
          </div>
        );
      })}
    </div>
  );
}
