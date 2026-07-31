"use client";

import statePaths from "@data/us_state_paths.json";
import cities from "@data/cities.json";
import { NO_DATA_COLOR } from "@/lib/severity/palette";
import { projectLatLon } from "@/lib/geo/projection";

const { viewBox, paths } = statePaths as {
  viewBox: string;
  paths: Record<string, string>;
};

export const CITY_POINTS = cities
  .map((city) => {
    const xy = projectLatLon(city.lat, city.lon);
    if (!xy) return null;
    return { city, x: xy[0], y: xy[1] };
  })
  .filter((p): p is { city: (typeof cities)[number]; x: number; y: number } => p !== null);

interface Props {
  ariaLabel: string;
  colorForCity: (cityId: string) => string | undefined;
  tooltipForCity: (cityId: string) => string | undefined;
  onSelectCity: (cityId: string) => void;
  selectedCityId: string | null;
  compact?: boolean;
}

/**
 * The shared US map surface (state outlines + 168 city markers). Mode 1's
 * per-allergen ramp and Mode 2's green->red composite ramp both render through
 * this one component, supplying only a color/tooltip function per city — the map
 * geometry and interaction logic live in exactly one place.
 */
export function BaseSvgMap({
  ariaLabel,
  colorForCity,
  tooltipForCity,
  onSelectCity,
  selectedCityId,
  compact,
}: Props) {
  return (
    <svg viewBox={viewBox} role="img" aria-label={ariaLabel} className="h-auto w-full">
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
        {CITY_POINTS.map(({ city, x, y }) => {
          const fill = colorForCity(city.id) ?? NO_DATA_COLOR;
          const isSelected = selectedCityId === city.id;
          const radius = compact ? (isSelected ? 4 : 2.5) : isSelected ? 6 : 4;
          const tooltip = tooltipForCity(city.id);

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
              aria-label={`${city.city}, ${city.state}${tooltip ? ` — ${tooltip}` : ""}`}
            >
              <title>
                {city.city}, {city.state}
                {tooltip ? ` — ${tooltip}` : ""}
              </title>
            </circle>
          );
        })}
      </g>
    </svg>
  );
}
