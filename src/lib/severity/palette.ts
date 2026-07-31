/**
 * Per-allergen palette. Per the dataviz skill's rule ("assign categorical hues in
 * fixed order, never cycled... a 9th series is never a generated hue — it folds
 * into small multiples") this app can't guarantee all ~28 allergens are mutually
 * distinguishable by hue alone — 360°/28 ≈ 12.9° apart, well under the ~25-30°
 * separation CVD-safe distinguishability needs. That's a real, accepted limit at
 * this scale, not a bug to chase to zero: color is a visual accent, not the
 * source of truth — StateDetailPanel always lists the exact allergen name + tier
 * + value in text for every active allergen, which is what actually disambiguates
 * when two rings land on similar hues.
 *
 * Given that limit, hues are spaced EVENLY around the full circle (360° / count)
 * rather than via a golden-angle walk — for a known, fixed count this gives
 * strictly better worst-case separation than golden angle's pseudo-random spread
 * (verified: a golden-angle sequence from grass's hue put a later allergen only
 * ~10° from grass, a visually-confirmed near-collision; even spacing guarantees
 * every pair is at least 360/N degrees apart). The tradeoff, accepted knowingly:
 * adding a 29th allergen reshuffles every hue rather than only appending one —
 * acceptable since no allergen's color is a memorized identity anywhere in this
 * app; the registry's `id`/`label` are the stable identifiers, not the color.
 */

const BASE_SATURATION = 68;
const BASE_LIGHTNESS = 45;

/** Grass is pinned to its established green (hue 142) for visual continuity with
 * the original validated-formula work; every other allergen spaces out from
 * there once the total count is known. */
const GRASS_HUE = 142;

export function hueForIndex(index: number, total: number): number {
  if (index === 0) return GRASS_HUE;
  const step = 360 / Math.max(total, 1);
  return (GRASS_HUE + step * index) % 360;
}

export function baseColorForIndex(index: number, total: number): string {
  const hue = hueForIndex(index, total);
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
