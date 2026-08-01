import { ALLERGENS } from "@/lib/allergens/registry";
import { seasonMultiplier } from "@/lib/severity/season";
import type { CountyPoint } from "@/lib/geo/county-points";

/**
 * Mirrors composite.ts's noisy-OR combination exactly, but reads from a
 * county-grid point's raw scores map instead of the city-keyed getSeverity
 * lookup -- duplicated rather than shared because the two data shapes
 * (city id -> lookup vs. an inline scores object) don't share a clean common
 * interface, but the combination math must stay identical. Only feeds the
 * heatmap gradient's interpolation input (see lib/geo/county-points.ts) --
 * never shown in the detail panel or reports.
 */
export function getCountyComposite(
  sensitivities: Record<string, number>,
  county: CountyPoint,
  month?: number,
): number | null {
  let survivalProduct = 1;
  let any = false;

  for (const allergen of ALLERGENS) {
    const sensitivity = sensitivities[allergen.id] ?? 0;
    if (sensitivity <= 0) continue;
    const rawScore = county.scores[allergen.id];
    if (rawScore === undefined) continue;

    const value = month
      ? Math.round(rawScore * seasonMultiplier(allergen.id, allergen.category, county.koppen, month))
      : rawScore;

    const weight = sensitivity / 100;
    const risk = weight * (value / 100);
    survivalProduct *= 1 - risk;
    any = true;
  }

  if (!any) return null;
  return Math.round((1 - survivalProduct) * 100);
}
