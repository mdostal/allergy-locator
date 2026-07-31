"use client";

import { useMemo } from "react";
import { BaseSvgMap, CITY_POINTS } from "@/components/BaseSvgMap";
import { CityMarker } from "@/components/CityMarker";
import { HeatmapLayer } from "@/components/HeatmapLayer";
import { getAllergen } from "@/lib/allergens/registry";
import { getSeverity } from "@/lib/severity/score";
import { intensityColor, NO_DATA_COLOR, HEATMAP_MARKER_FILL } from "@/lib/severity/palette";

interface Props {
  active: Set<string>;
  onSelectCity: (cityId: string) => void;
  selectedCityId: string | null;
  month: number | null;
}

/**
 * Mode 1: every active allergen renders on the SAME map (not separate small
 * multiples — an earlier round used small multiples per the dataviz skill's
 * categorical-hue-count guidance, but the user explicitly asked for one shared
 * map instead, so this overrides that). Exactly one active allergen renders as
 * a continuous gradient surface (interpolated across all 168 cities, not just
 * a colored dot per city — dots alone were the single biggest visual weakness
 * in the first version). Multiple active allergens render as concentric rings
 * at the same point — outermost ring = first active allergen in registry
 * order, each ring its own hue/intensity — since blending several continuous
 * fields into one surface is a harder follow-up, not attempted here. Full
 * detail for every active allergen at the selected city is still in
 * StateDetailPanel, unabbreviated.
 */
export function UsMap({ active, onSelectCity, selectedCityId, month }: Props) {
  const activeIds = Array.from(active);
  const singleAllergenId = activeIds.length === 1 ? activeIds[0] : null;
  const singleAllergen = singleAllergenId ? getAllergen(singleAllergenId) : null;

  const heatmapPoints = useMemo(() => {
    if (!singleAllergenId) return [];
    return CITY_POINTS.map((point) => {
      const severity = getSeverity(singleAllergenId, point.city.id, month ?? undefined);
      return severity ? { x: point.x, y: point.y, value: severity.value } : null;
    }).filter((p): p is { x: number; y: number; value: number } => p !== null);
  }, [singleAllergenId, month]);

  const colorForValue = useMemo(
    () => (singleAllergen ? (value: number) => intensityColor(singleAllergen.color, value) : null),
    [singleAllergen],
  );

  return (
    <BaseSvgMap
      ariaLabel="US allergen severity map"
      onSelectCity={onSelectCity}
      selectedCityId={selectedCityId}
      heatmap={
        colorForValue ? <HeatmapLayer points={heatmapPoints} colorForValue={colorForValue} /> : undefined
      }
      renderMarker={(point, isSelected) => {
        if (activeIds.length === 0) {
          return (
            <CityMarker point={point} isSelected={isSelected} fill={NO_DATA_COLOR} />
          );
        }

        if (singleAllergenId && singleAllergen) {
          const severity = getSeverity(singleAllergenId, point.city.id, month ?? undefined);
          return (
            <CityMarker
              point={point}
              isSelected={isSelected}
              fill={HEATMAP_MARKER_FILL}
              radius={isSelected ? 4 : 2.5}
              tooltip={severity ? `${severity.tier} (${severity.value})` : undefined}
            />
          );
        }

        // 2+ active: concentric rings, outermost first, all at this one point.
        const baseRadius = isSelected ? 8 : 6.5;
        const step = Math.min(1.8, (baseRadius - 1.5) / activeIds.length);
        return (
          <>
            {activeIds.map((allergenId, i) => {
              const allergen = getAllergen(allergenId);
              const severity = getSeverity(allergenId, point.city.id, month ?? undefined);
              const r = Math.max(1.5, baseRadius - i * step);
              const fill =
                severity && allergen ? intensityColor(allergen.color, severity.value) : NO_DATA_COLOR;
              const label = `${allergen?.label ?? allergenId}: ${
                severity ? `${severity.tier} (${severity.value})` : "no data"
              }`;
              const fullLabel = `${point.city.city}, ${point.city.state} — ${label}`;
              return (
                <circle
                  key={allergenId}
                  cx={point.x.toFixed(2)}
                  cy={point.y.toFixed(2)}
                  r={r}
                  fill={fill}
                  stroke={i === 0 ? (isSelected ? "#111827" : "white") : "none"}
                  strokeWidth={i === 0 ? (isSelected ? 1.5 : 0.6) : 0}
                  role="button"
                  aria-label={fullLabel}
                >
                  <title>{fullLabel}</title>
                </circle>
              );
            })}
          </>
        );
      }}
    />
  );
}
