export type OverlayCombination = "max" | "noisy-or";

/**
 * Blends multiple people's already-computed composite scores (each 0-100)
 * into one value, for the "compare profiles" overlay (v3). Per explicit user
 * direction, offered as switchable views rather than picking one fixed
 * default:
 *   - "max": worst-case -- whoever's most affected sets the color. Answers
 *     "is this place bad for ANYONE in the group?"
 *   - "noisy-or": extends the same independent-risk compounding already used
 *     to combine one person's multiple allergens (see composite.ts) across
 *     people instead. Answers "how likely is at least one person to have a
 *     bad time here?"
 */
export function combineCompositeValues(values: number[], combination: OverlayCombination): number {
  if (combination === "max") return Math.max(...values);
  const survivalProduct = values.reduce((product, value) => product * (1 - value / 100), 1);
  return Math.round((1 - survivalProduct) * 100);
}
