"use client";

import { useMemo } from "react";
import { BaseSvgMap, CITY_POINTS } from "@/components/BaseSvgMap";
import { CityMarker } from "@/components/CityMarker";
import { HeatmapLayer } from "@/components/HeatmapLayer";
import { getComposite } from "@/lib/severity/composite";
import { getCountyComposite } from "@/lib/severity/county-composite";
import { COUNTY_POINTS } from "@/lib/geo/county-points";
import { compositeColor, NO_DATA_COLOR, HEATMAP_MARKER_FILL } from "@/lib/severity/palette";

interface Props {
  sensitivities: Record<string, number>;
  onSelectCity: (cityId: string) => void;
  selectedCityId: string | null;
  month: number | null;
}

/** Mode 2: one personalized green->red composite map, per the user's own framing
 * ("make the chart that goes from green to red purely on YOUR allergies").
 * Always exactly one scalar field, so it always renders as a continuous
 * gradient surface (interpolated across all 168 cities) rather than isolated
 * dots -- city markers become small, subtle click-targets instead. */
export function CompositeMap({ sensitivities, onSelectCity, selectedCityId, month }: Props) {
  const heatmapPoints = useMemo(() => {
    const cityPoints = CITY_POINTS.map((point) => {
      const composite = getComposite(sensitivities, point.city.id, month ?? undefined);
      return composite ? { x: point.x, y: point.y, value: composite.value } : null;
    }).filter((p): p is { x: number; y: number; value: number } => p !== null);

    // The county grid (data/county-grid.json, see data/county-grid-
    // methodology.md) densifies the interpolation far beyond the 168 cities
    // -- it never overrides them, only fills the gaps between them.
    const countyPoints = COUNTY_POINTS.map((point) => {
      const value = getCountyComposite(sensitivities, point, month ?? undefined);
      return value !== null ? { x: point.x, y: point.y, value } : null;
    }).filter((p): p is { x: number; y: number; value: number } => p !== null);

    return [...cityPoints, ...countyPoints];
  }, [sensitivities, month]);

  return (
    <BaseSvgMap
      ariaLabel="Your personalized allergy severity map"
      onSelectCity={onSelectCity}
      selectedCityId={selectedCityId}
      heatmap={<HeatmapLayer points={heatmapPoints} colorForValue={compositeColor} />}
      renderMarker={(point, isSelected) => {
        const composite = getComposite(sensitivities, point.city.id, month ?? undefined);
        return (
          <CityMarker
            point={point}
            isSelected={isSelected}
            fill={composite ? HEATMAP_MARKER_FILL : NO_DATA_COLOR}
            radius={isSelected ? 4 : 2.5}
            tooltip={composite ? `your score: ${composite.value}/100` : undefined}
          />
        );
      }}
    />
  );
}
