"use client";

import { useMemo } from "react";
import { BaseSvgMap, CITY_POINTS } from "@/components/BaseSvgMap";
import { CityMarker } from "@/components/CityMarker";
import { HeatmapLayer } from "@/components/HeatmapLayer";
import { getCareAccess, type CareAccessLayer } from "@/lib/care-access/score";
import { compositeColor, NO_DATA_COLOR, HEATMAP_MARKER_FILL } from "@/lib/severity/palette";

interface Props {
  layer: CareAccessLayer;
  onSelectCity: (cityId: string) => void;
  selectedCityId: string | null;
}

/**
 * Livability Atlas dimension 2 (docs/ROADMAP.md) -- the second real dataset,
 * built deliberately as its OWN standalone map rather than forced into the
 * allergy MapView's mode/session state, per v5's plan (.pHive/planning/
 * roadmap.md) to prove out a second real case before generalizing the map
 * engine. Reuses BaseSvgMap/HeatmapLayer/CityMarker unchanged -- they were
 * already dataset-agnostic (just points + a colorForValue function).
 *
 * Unlike allergy, there's no county-grid densification for this dataset yet
 * (that was a turf/climate-specific pipeline) -- the gradient interpolates
 * only from the 168 city points, a real, honestly coarser resolution than
 * allergy's map.
 */
export function CareAccessMap({ layer, onSelectCity, selectedCityId }: Props) {
  const heatmapPoints = useMemo(() => {
    return CITY_POINTS.map((point) => {
      const result = getCareAccess(point.city.id, layer);
      return result ? { x: point.x, y: point.y, value: result.value } : null;
    }).filter((p): p is { x: number; y: number; value: number } => p !== null);
  }, [layer]);

  return (
    <BaseSvgMap
      ariaLabel="Care access map"
      onSelectCity={onSelectCity}
      selectedCityId={selectedCityId}
      heatmap={<HeatmapLayer points={heatmapPoints} colorForValue={compositeColor} />}
      renderMarker={(point, isSelected) => {
        const result = getCareAccess(point.city.id, layer);
        const tooltip = result
          ? `${result.nearestFacility} (${result.facilityCity}) — ~${Math.round(result.driveMinutes)} min`
          : undefined;
        return (
          <CityMarker
            point={point}
            isSelected={isSelected}
            fill={result ? HEATMAP_MARKER_FILL : NO_DATA_COLOR}
            radius={isSelected ? 4 : 2.5}
            tooltip={tooltip}
          />
        );
      }}
    />
  );
}
