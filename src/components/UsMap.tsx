"use client";

import { BaseSvgMap } from "@/components/BaseSvgMap";
import { CityMarker } from "@/components/CityMarker";
import { getAllergen } from "@/lib/allergens/registry";
import { getSeverity } from "@/lib/severity/score";
import { intensityColor, NO_DATA_COLOR } from "@/lib/severity/palette";

interface Props {
  active: Set<string>;
  onSelectCity: (cityId: string) => void;
  selectedCityId: string | null;
}

/**
 * Mode 1: every active allergen renders on the SAME map (not separate small
 * multiples — an earlier round used small multiples per the dataviz skill's
 * categorical-hue-count guidance, but the user explicitly asked for one shared
 * map instead, so this overrides that). A single active allergen is one colored
 * dot per city, per its own sequential ramp. Multiple active allergens render as
 * concentric rings at the same point — outermost ring = first active allergen in
 * registry order, each ring its own hue/intensity — so several allergens' status
 * for one city are visible at a glance without needing N separate maps. Full
 * detail for every active allergen at the selected city is still in
 * StateDetailPanel, unabbreviated.
 */
export function UsMap({ active, onSelectCity, selectedCityId }: Props) {
  const activeIds = Array.from(active);

  return (
    <BaseSvgMap
      ariaLabel="US allergen severity map"
      onSelectCity={onSelectCity}
      selectedCityId={selectedCityId}
      renderMarker={(point, isSelected) => {
        if (activeIds.length === 0) {
          return (
            <CityMarker point={point} isSelected={isSelected} fill={NO_DATA_COLOR} />
          );
        }

        if (activeIds.length === 1) {
          const allergenId = activeIds[0];
          const allergen = getAllergen(allergenId);
          const severity = getSeverity(allergenId, point.city.id);
          return (
            <CityMarker
              point={point}
              isSelected={isSelected}
              fill={
                severity && allergen ? intensityColor(allergen.color, severity.value) : NO_DATA_COLOR
              }
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
              const severity = getSeverity(allergenId, point.city.id);
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
