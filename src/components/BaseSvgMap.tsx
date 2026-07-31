"use client";

import type { ReactNode } from "react";
import statePaths from "@data/us_state_paths.json";
import cities from "@data/cities.json";
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

export type CityPoint = (typeof CITY_POINTS)[number];

interface Props {
  ariaLabel: string;
  /** Full control over how one city renders — a single dot (Mode 1 with one
   * allergen, Mode 2's composite) or a stack of rings (Mode 1 with several
   * allergens active at once, all on this same map). */
  renderMarker: (point: CityPoint, isSelected: boolean) => ReactNode;
  onSelectCity: (cityId: string) => void;
  selectedCityId: string | null;
  /** A continuous gradient surface (HeatmapLayer), rendered behind the state
   * outlines in the same coordinate space. Optional: the 2+ active-allergen
   * case still uses concentric-ring markers instead (see UsMap), since
   * blending multiple continuous fields into one surface is a genuinely
   * harder follow-up, not attempted here. */
  heatmap?: ReactNode;
}

/**
 * The shared US map surface: state outlines + 168 city positions. Every mode
 * (Mode 1 single/multi-allergen, Mode 2 composite) renders through this one
 * component so the map geometry, projection, and click wiring live in exactly one
 * place — only the per-city marker (and optional heatmap layer) differs.
 */
export function BaseSvgMap({ ariaLabel, renderMarker, onSelectCity, selectedCityId, heatmap }: Props) {
  return (
    <div className="relative overflow-hidden rounded-lg bg-white dark:bg-zinc-900">
      {heatmap}
      <svg viewBox={viewBox} role="img" aria-label={ariaLabel} className="relative h-auto w-full">
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={0.75}
          className="text-zinc-400 dark:text-zinc-500"
        >
          {Object.entries(paths).map(([code, d]) => (
            <path key={code} d={d} />
          ))}
        </g>
        <g>
          {CITY_POINTS.map((point) => {
            const isSelected = selectedCityId === point.city.id;
            return (
              <g
                key={point.city.id}
                onClick={() => onSelectCity(point.city.id)}
                className="cursor-pointer"
              >
                {renderMarker(point, isSelected)}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}
