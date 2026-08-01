"use client";

import { useMemo } from "react";
import { BaseSvgMap, CITY_POINTS } from "@/components/BaseSvgMap";
import { CityMarker } from "@/components/CityMarker";
import { HeatmapLayer } from "@/components/HeatmapLayer";
import { getAllergen, type AllergenDef } from "@/lib/allergens/registry";
import { getSeverity } from "@/lib/severity/score";
import { seasonMultiplier } from "@/lib/severity/season";
import { COUNTY_POINTS } from "@/lib/geo/county-points";
import { intensityColor, NO_DATA_COLOR, HEATMAP_MARKER_FILL } from "@/lib/severity/palette";

interface Props {
  active: Set<string>;
  onSelectCity: (cityId: string) => void;
  selectedCityId: string | null;
  month: number | null;
}

interface AllergenLayer {
  allergen: AllergenDef;
  points: Array<{ x: number; y: number; value: number }>;
}

/** Full opacity for a single active allergen (matches the original solid
 * look); partial opacity per layer once 2+ stack, so overlapping severity
 * reads as a visually denser blend instead of one color fully hiding another. */
function opacityFor(layerCount: number): number {
  return layerCount <= 1 ? 1 : 0.65;
}

/**
 * Mode 1: every active allergen renders on the SAME map (not separate small
 * multiples — an earlier round used small multiples per the dataviz skill's
 * categorical-hue-count guidance, but the user explicitly asked for one shared
 * map instead, so this overrides that). Every active allergen gets its own
 * continuous gradient surface (interpolated across all 168 cities + the
 * county grid, not colored dots — dots alone were the single biggest visual
 * weakness in the first version) stacked at partial opacity when 2+ are
 * active, per explicit user direction: "turning each on should enable
 * another with an opacity and basically overlapping heatmaps." Full detail
 * for every active allergen at the selected city is still in
 * StateDetailPanel, unabbreviated.
 */
export function UsMap({ active, onSelectCity, selectedCityId, month }: Props) {
  const layers = useMemo<AllergenLayer[]>(() => {
    return Array.from(active)
      .map((allergenId): AllergenLayer | null => {
        const allergen = getAllergen(allergenId);
        if (!allergen) return null;

        const cityPoints = CITY_POINTS.map((point) => {
          const severity = getSeverity(allergenId, point.city.id, month ?? undefined);
          return severity ? { x: point.x, y: point.y, value: severity.value } : null;
        }).filter((p): p is { x: number; y: number; value: number } => p !== null);

        // The county grid (data/county-grid.json, see data/county-grid-
        // methodology.md) densifies the interpolation far beyond the 168
        // cities -- it never overrides them, only fills the gaps between them.
        const countyPoints = COUNTY_POINTS.map((point) => {
          const raw = point.scores[allergenId];
          if (raw === undefined) return null;
          const value = month
            ? Math.round(raw * seasonMultiplier(allergenId, allergen.category, point.koppen, month))
            : raw;
          return { x: point.x, y: point.y, value };
        }).filter((p): p is { x: number; y: number; value: number } => p !== null);

        return { allergen, points: [...cityPoints, ...countyPoints] };
      })
      .filter((l): l is AllergenLayer => l !== null);
  }, [active, month]);

  return (
    <BaseSvgMap
      ariaLabel="US allergen severity map"
      onSelectCity={onSelectCity}
      selectedCityId={selectedCityId}
      heatmap={
        layers.length > 0 ? (
          <>
            {layers.map(({ allergen, points }) => (
              <HeatmapLayer
                key={allergen.id}
                points={points}
                colorForValue={(value) => intensityColor(allergen.color, value)}
                opacity={opacityFor(layers.length)}
              />
            ))}
          </>
        ) : undefined
      }
      renderMarker={(point, isSelected) => {
        if (layers.length === 0) {
          return <CityMarker point={point} isSelected={isSelected} fill={NO_DATA_COLOR} />;
        }

        const tooltip =
          layers.length === 1
            ? (() => {
                const severity = getSeverity(layers[0].allergen.id, point.city.id, month ?? undefined);
                return severity ? `${severity.tier} (${severity.value})` : undefined;
              })()
            : `${layers.length} allergens active`;

        return (
          <CityMarker
            point={point}
            isSelected={isSelected}
            fill={HEATMAP_MARKER_FILL}
            radius={isSelected ? 4 : 2.5}
            tooltip={tooltip}
          />
        );
      }}
    />
  );
}
