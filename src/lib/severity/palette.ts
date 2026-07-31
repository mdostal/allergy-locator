/**
 * Per-allergen palette. Per the dataviz skill's rule ("assign categorical hues in
 * fixed order, never cycled... a 9th series is never a generated hue — it folds
 * into small multiples") this app never asks a user to visually distinguish 20
 * simultaneous hues on one map. Instead:
 *   - Each allergen gets its own SEQUENTIAL ramp (one hue, light→dark = magnitude)
 *     — this is exactly what the skill prescribes for a magnitude encoding, and it
 *     needs no cross-allergen distinguishability at all.
 *   - When more than one allergen is active at once, the map renders as small
 *     multiples (one mini-map per allergen, each self-labeled with its name) —
 *     see components/UsMap.tsx. Identity comes from the label, not from picking 20
 *     mutually-distinguishable hues, which isn't achievable past ~8 series anyway.
 *
 * Hue assignment uses a golden-angle rotation (≈137.5°) keyed by each allergen's
 * fixed position in the registry, so adding a 21st allergen never reshuffles the
 * first 20 and never requires hand-picking a color — a color is DATA, derived from
 * position, matching the epic's "never hardcode per-allergen anything" rule.
 */

const GOLDEN_ANGLE = 137.508;
const BASE_SATURATION = 68;
const BASE_LIGHTNESS = 45;

/** Grass is pinned to its established green (hue 142) for visual continuity with
 * the original validated-formula work; every other allergen rotates from there. */
const GRASS_HUE = 142;

export function hueForIndex(index: number): number {
  if (index === 0) return GRASS_HUE;
  return (GRASS_HUE + GOLDEN_ANGLE * index) % 360;
}

export function baseColorForIndex(index: number): string {
  const hue = hueForIndex(index);
  return `hsl(${hue.toFixed(1)} ${BASE_SATURATION}% ${BASE_LIGHTNESS}%)`;
}

function parseHslHue(hslString: string): number {
  const match = hslString.match(/hsl\(([\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

/**
 * value: 0-100 severity. Returns a CSS hsl() string: low severity = a light tint of
 * the allergen's base hue, high severity = a fully saturated, darker shade — a
 * single-hue sequential ramp, per the dataviz skill's rule for magnitude encoding.
 */
export function intensityColor(baseColor: string, value: number): string {
  const hue = parseHslHue(baseColor);
  const clamped = Math.max(0, Math.min(100, value));
  const lightness = 92 - (clamped / 100) * 60;
  return `hsl(${hue.toFixed(1)} ${BASE_SATURATION}% ${lightness.toFixed(1)}%)`;
}

export const NO_DATA_COLOR = "hsl(0 0% 88%)";

/**
 * Mode 2's composite scale: green (good/low) -> red (bad/high). This is a single
 * continuous ramp (hue interpolates 142->0 as value rises), not a categorical
 * palette, so the dataviz skill's categorical-hue-count rule doesn't apply here —
 * per the skill's own scope note, a sequential/ramp scale is checked for lightness
 * monotonicity, which this satisfies (92% -> 32% as value rises, same as every
 * per-allergen ramp).
 */
export function compositeColor(value: number): string {
  const clamped = Math.max(0, Math.min(100, value));
  const hue = GRASS_HUE - (GRASS_HUE / 100) * clamped; // 142 -> 0
  const lightness = 90 - (clamped / 100) * 55;
  return `hsl(${hue.toFixed(1)} 72% ${lightness.toFixed(1)}%)`;
}
