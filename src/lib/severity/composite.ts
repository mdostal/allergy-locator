import { ALLERGENS } from "@/lib/allergens/registry";
import { getSeverity } from "@/lib/severity/score";
import type { ModelSettings } from "@/lib/model-settings";

export interface CompositeResult {
  value: number; // 0-100, blended
  contributions: Array<{ allergenId: string; sensitivity: number; severity: number }>;
}

export interface CompositeOptions {
  month?: number;
  seasonStrength?: number;
  /** Trip planner: an exact day-of-month for real per-city daily precision
   * (see lib/severity/daily-curves.ts), rather than the month's mid-month
   * representative value. */
  day?: number;
  /** Advanced mode (lib/model-settings.ts): "noisy-or" is the shipped
   * default (see below); "average" is a plain sensitivity-weighted mean
   * instead -- a real, live-computed alternative, not a cosmetic toggle. */
  combinationMethod?: ModelSettings["combinationMethod"];
}

/**
 * Mode 2: the personalized reverse-lookup. Combines every allergen with a nonzero
 * sensitivity using a noisy-OR (independent-risk) combination rather than a plain
 * weighted average: real allergy exposure compounds -- a person who's highly
 * reactive to grass AND moderately reactive to two weeds is realistically at least
 * as miserable as the grass alone would make them, not diluted toward the average
 * of a strong and two weak signals. Each allergen contributes
 * `weight * (severity/100)` as an independent "risk" probability; the combined
 * risk is `1 - product(1 - risk_i)`, which:
 *   - reduces exactly to a single allergen's own severity when only it is active
 *     at 100 sensitivity (a useful sanity property, exercised in tests)
 *   - never DECREASES when another nonzero-sensitivity allergen is added
 *   - never trivially saturates to 100 just because many allergens are active
 *     (unlike a raw unbounded sum)
 *
 * `combinationMethod: "average"` (Advanced mode) switches to a plain
 * sensitivity-weighted mean instead, for direct comparison against the
 * shipped default -- both are computed live, not a fake toggle.
 */
export function getComposite(
  sensitivities: Record<string, number>,
  cityId: string,
  month?: number,
  options: CompositeOptions = {},
): CompositeResult | null {
  const { seasonStrength, combinationMethod = "noisy-or", day } = options;
  let survivalProduct = 1;
  let weightedSum = 0;
  let weightTotal = 0;
  const contributions: CompositeResult["contributions"] = [];

  for (const allergen of ALLERGENS) {
    const sensitivity = sensitivities[allergen.id] ?? 0;
    if (sensitivity <= 0) continue;
    const severity = getSeverity(allergen.id, cityId, month, seasonStrength, day);
    if (!severity) continue;
    const weight = sensitivity / 100;
    const risk = weight * (severity.value / 100);
    survivalProduct *= 1 - risk;
    weightedSum += sensitivity * severity.value;
    weightTotal += sensitivity;
    contributions.push({ allergenId: allergen.id, sensitivity, severity: severity.value });
  }

  if (contributions.length === 0) return null;

  const value =
    combinationMethod === "average"
      ? Math.round(weightedSum / weightTotal)
      : Math.round((1 - survivalProduct) * 100);

  return {
    value,
    contributions: contributions.sort(
      (a, b) => b.severity * b.sensitivity - a.severity * a.sensitivity,
    ),
  };
}
