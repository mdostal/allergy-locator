"use client";

import cities from "@data/cities.json";
import { getAllergen } from "@/lib/allergens/registry";
import { getSeverity } from "@/lib/severity/score";

interface Props {
  cityId: string | null;
  activeAllergenId: string | null;
}

const COMPONENT_LABELS: Record<string, string> = {
  base_season_climate: "Season length × climate",
  turf_boost: "Irrigated/planted turf",
  arid_weed: "Arid-Southwest weed + dust",
  elevation_discount: "Elevation (dry-high discount)",
  coastal_nudge: "Coastal moderation",
};

export function StateDetailPanel({ cityId, activeAllergenId }: Props) {
  if (!cityId) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Click a city on the map to see its allergen detail.
      </p>
    );
  }

  const city = cities.find((c) => c.id === cityId);
  if (!city) return null;

  const allergen = activeAllergenId ? getAllergen(activeAllergenId) : undefined;
  const severity = activeAllergenId ? getSeverity(activeAllergenId, cityId) : null;

  return (
    <div className="rounded-lg border border-zinc-200 p-4 text-sm dark:border-zinc-800">
      <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
        {city.city}, {city.state}
      </h3>
      {!allergen && (
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Toggle an allergen to see its severity here.
        </p>
      )}
      {allergen && !severity && (
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          No {allergen.label.toLowerCase()} data for this city.
        </p>
      )}
      {allergen && severity && (
        <div className="mt-2 space-y-2">
          <p className="text-zinc-700 dark:text-zinc-300">
            <span className="font-medium">{allergen.label}</span>: {severity.tier} (
            {severity.value}/100)
            {severity.confidence === "modeled" && (
              <span className="ml-1 text-xs text-zinc-400">— modeled, not ground-truth-validated</span>
            )}
          </p>
          <p className="italic text-zinc-600 dark:text-zinc-400">{severity.why}</p>
          {severity.components && (
            <ul className="space-y-0.5 text-xs text-zinc-500 dark:text-zinc-400">
              {Object.entries(severity.components).map(([key, value]) => (
                <li key={key}>
                  {COMPONENT_LABELS[key] ?? key}: {value > 0 ? "+" : ""}
                  {value}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
