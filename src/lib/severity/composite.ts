import { ALLERGENS } from "@/lib/allergens/registry";
import { getSeverity } from "@/lib/severity/score";

export interface CompositeResult {
  value: number; // 0-100, blended
  contributions: Array<{ allergenId: string; sensitivity: number; severity: number }>;
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
 */
export function getComposite(
  sensitivities: Record<string, number>,
  cityId: string,
): CompositeResult | null {
  let survivalProduct = 1;
  const contributions: CompositeResult["contributions"] = [];

  for (const allergen of ALLERGENS) {
    const sensitivity = sensitivities[allergen.id] ?? 0;
    if (sensitivity <= 0) continue;
    const severity = getSeverity(allergen.id, cityId);
    if (!severity) continue;
    const weight = sensitivity / 100;
    const risk = weight * (severity.value / 100);
    survivalProduct *= 1 - risk;
    contributions.push({ allergenId: allergen.id, sensitivity, severity: severity.value });
  }

  if (contributions.length === 0) return null;

  return {
    value: Math.round((1 - survivalProduct) * 100),
    contributions: contributions.sort(
      (a, b) => b.severity * b.sensitivity - a.severity * a.sensitivity,
    ),
  };
}
