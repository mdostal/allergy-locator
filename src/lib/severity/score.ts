import grassScores from "@data/allergy-scores.json";
import { hasAllergen } from "@/lib/severity/gate";
import type { SeverityResult } from "@/lib/severity/types";

const grassScoreIndex = new Map(grassScores.map((entry) => [entry.id, entry]));

/**
 * Per-allergen, per-city severity. Grass reads the already-validated,
 * ground-truth-fit values from data/allergy-scores.json (MAE 2.3 — see
 * data/allergy-scoring.md). Every other allergen (added in story s4) will be
 * `confidence: "modeled"`, never silently reported with grass's rigor.
 */
export function getSeverity(
  allergenId: string,
  cityId: string,
): SeverityResult | null {
  if (!hasAllergen(allergenId, cityId)) {
    return null;
  }

  if (allergenId === "grass") {
    const entry = grassScoreIndex.get(cityId);
    if (!entry) return null;
    return {
      value: entry.score,
      tier: entry.tier as SeverityResult["tier"],
      confidence: "validated",
      why: entry.why,
      components: {
        base_season_climate: entry.base_season_climate,
        turf_boost: entry.turf_boost,
        arid_weed: entry.arid_weed,
        elevation_discount: entry.elevation_discount,
        coastal_nudge: entry.coastal_nudge,
      },
    };
  }

  return null;
}
