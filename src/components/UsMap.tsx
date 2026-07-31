"use client";

import { useMemo } from "react";
import statePaths from "@data/us_state_paths.json";
import cities from "@data/cities.json";
import { ALLERGENS, getAllergen } from "@/lib/allergens/registry";
import { getSeverity } from "@/lib/severity/score";
import { intensityColor, NO_DATA_COLOR } from "@/lib/severity/palette";
import { projectLatLon } from "@/lib/geo/projection";

interface Props {
  active: Set<string>;
  onSelectCity: (cityId: string) => void;
  selectedCityId: string | null;
}

const { viewBox, paths } = statePaths as {
  viewBox: string;
  paths: Record<string, string>;
};

export function UsMap({ active, onSelectCity, selectedCityId }: Props) {
  const points = useMemo(
    () =>
      cities
        .map((city) => {
          const xy = projectLatLon(city.lat, city.lon);
          if (!xy) return null;
          return { city, x: xy[0], y: xy[1] };
        })
        .filter((p): p is { city: (typeof cities)[number]; x: number; y: number } => p !== null),
    [],
  );

  // s2 has exactly one allergen in the registry, so "which active allergen colors
  // this city" is trivial. Story s4 (multiple real allergens) is where a real
  // multi-overlay visual treatment (stacked segments, small multiples, etc.) needs
  // a dataviz-informed design decision -- deliberately not solved here.
  const primaryActiveId = active.size > 0 ? Array.from(active)[0] : null;

  return (
    <svg
      viewBox={viewBox}
      role="img"
      aria-label="US allergen severity map"
      className="h-auto w-full max-w-4xl"
    >
      <g fill="none" stroke="currentColor" strokeWidth={0.5} className="text-zinc-300 dark:text-zinc-700">
        {Object.entries(paths).map(([code, d]) => (
          <path key={code} d={d} />
        ))}
      </g>
      <g>
        {points.map(({ city, x, y }) => {
          const severity = primaryActiveId
            ? getSeverity(primaryActiveId, city.id)
            : null;
          const allergen = primaryActiveId ? getAllergen(primaryActiveId) : undefined;
          const fill =
            severity && allergen
              ? intensityColor(allergen.color, severity.value)
              : NO_DATA_COLOR;
          const isSelected = selectedCityId === city.id;

          return (
            <circle
              key={city.id}
              cx={x}
              cy={y}
              r={isSelected ? 6 : 4}
              fill={fill}
              stroke={isSelected ? "#111827" : "white"}
              strokeWidth={isSelected ? 1.5 : 0.75}
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

export const ALLERGEN_COUNT = ALLERGENS.length;
