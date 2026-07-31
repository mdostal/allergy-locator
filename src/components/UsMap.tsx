"use client";

import { useMemo } from "react";
import statePaths from "@data/us_state_paths.json";
import cities from "@data/cities.json";
import { getAllergen } from "@/lib/allergens/registry";
import { getSeverity } from "@/lib/severity/score";
import { intensityColor, NO_DATA_COLOR } from "@/lib/severity/palette";
import { projectLatLon } from "@/lib/geo/projection";

const { viewBox, paths } = statePaths as {
  viewBox: string;
  paths: Record<string, string>;
};

const POINTS = cities
  .map((city) => {
    const xy = projectLatLon(city.lat, city.lon);
    if (!xy) return null;
    return { city, x: xy[0], y: xy[1] };
  })
  .filter((p): p is { city: (typeof cities)[number]; x: number; y: number } => p !== null);

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
    <svg
      viewBox={viewBox}
      role="img"
      aria-label={
        allergen ? `${allergen.label} severity map` : "US allergen severity map"
      }
      className="h-auto w-full"
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeWidth={0.5}
        className="text-zinc-300 dark:text-zinc-700"
      >
        {Object.entries(paths).map(([code, d]) => (
          <path key={code} d={d} />
        ))}
      </g>
      <g>
        {POINTS.map(({ city, x, y }) => {
          const severity = allergenId ? getSeverity(allergenId, city.id) : null;
          const fill =
            severity && allergen
              ? intensityColor(allergen.color, severity.value)
              : NO_DATA_COLOR;
          const isSelected = selectedCityId === city.id;
          const radius = compact ? (isSelected ? 4 : 2.5) : isSelected ? 6 : 4;

          return (
            <circle
              key={city.id}
              cx={x}
              cy={y}
              r={radius}
              fill={fill}
              stroke={isSelected ? "#111827" : "white"}
              strokeWidth={isSelected ? 1.5 : 0.6}
              onClick={() => onSelectCity(city.id)}
              className="cursor-pointer"
              role="button"
              aria-label={`${city.city}, ${city.state}${
                severity ? ` — ${severity.tier}` : ""
              }`}
            >
              <title>
                {city.city}, {city.state}
                {severity ? ` — ${severity.tier} (${severity.value})` : ""}
              </title>
            </circle>
          );
        })}
      </g>
    </svg>
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
