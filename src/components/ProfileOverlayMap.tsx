"use client";

import { useMemo } from "react";
import { BaseSvgMap, CITY_POINTS } from "@/components/BaseSvgMap";
import { CityMarker } from "@/components/CityMarker";
import { HeatmapLayer } from "@/components/HeatmapLayer";
import { getComposite } from "@/lib/severity/composite";
import { getCountyComposite } from "@/lib/severity/county-composite";
import { COUNTY_POINTS } from "@/lib/geo/county-points";
import { combineCompositeValues, type OverlayCombination } from "@/lib/severity/combine-profiles";
import { compositeColor, NO_DATA_COLOR, HEATMAP_MARKER_FILL } from "@/lib/severity/palette";
import type { ModelSettings } from "@/lib/model-settings";
import type { SavedProfile } from "@/lib/profiles";

interface Props {
  profiles: SavedProfile[];
  combination: OverlayCombination;
  onSelectCity: (cityId: string) => void;
  selectedCityId: string | null;
  month: number | null;
  settings: ModelSettings;
}

/**
 * v3: blends 2+ saved profiles' composite severity into one map -- the
 * "worst-case" and "noisy-OR across people" views from ProfileCompare (see
 * lib/severity/combine-profiles.ts for the actual combination math). The
 * unblended "side-by-side" view instead renders two independent
 * <CompositeMap> instances directly in MapView, no combination needed.
 */
export function ProfileOverlayMap({ profiles, combination, onSelectCity, selectedCityId, month, settings }: Props) {
  const { seasonStrength, combinationMethod, idwPower } = settings;
  const options = useMemo(() => ({ seasonStrength, combinationMethod }), [seasonStrength, combinationMethod]);

  function combinedForCity(cityId: string): number | null {
    const values = profiles
      .map((p) => getComposite(p.sensitivities, cityId, month ?? undefined, options)?.value)
      .filter((v): v is number => v !== undefined);
    return values.length > 0 ? combineCompositeValues(values, combination) : null;
  }

  const heatmapPoints = useMemo(() => {
    const cityPoints = CITY_POINTS.map((point) => {
      const value = combinedForCity(point.city.id);
      return value !== null ? { x: point.x, y: point.y, value } : null;
    }).filter((p): p is { x: number; y: number; value: number } => p !== null);

    const countyPoints = COUNTY_POINTS.map((point) => {
      const values = profiles
        .map((p) => getCountyComposite(p.sensitivities, point, month ?? undefined, options))
        .filter((v): v is number => v !== null);
      const value = values.length > 0 ? combineCompositeValues(values, combination) : null;
      return value !== null ? { x: point.x, y: point.y, value } : null;
    }).filter((p): p is { x: number; y: number; value: number } => p !== null);

    return [...cityPoints, ...countyPoints];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- combinedForCity closes over profiles/month/options, already listed below
  }, [profiles, month, options, combination]);

  return (
    <BaseSvgMap
      ariaLabel={`Combined allergy severity across ${profiles.length} profiles (${
        combination === "max" ? "worst-case" : "noisy-OR"
      })`}
      onSelectCity={onSelectCity}
      selectedCityId={selectedCityId}
      heatmap={<HeatmapLayer points={heatmapPoints} colorForValue={compositeColor} power={idwPower} />}
      renderMarker={(point, isSelected) => {
        const value = combinedForCity(point.city.id);
        return (
          <CityMarker
            point={point}
            isSelected={isSelected}
            fill={value !== null ? HEATMAP_MARKER_FILL : NO_DATA_COLOR}
            radius={isSelected ? 4 : 2.5}
            tooltip={value !== null ? `combined score: ${value}/100` : undefined}
          />
        );
      }}
    />
  );
}
