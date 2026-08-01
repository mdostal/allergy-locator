/**
 * Advanced mode's live-adjustable parameters (explicit user direction: "ANY
 * FORMULA or other guesswork we have should be front and center and ALLOW
 * MODIFICATION... show all variables and allow them to be changed so people
 * can play with it"). These are genuinely computed client-side on every
 * change, not cosmetic sliders -- see each setting's consuming module for
 * exactly where it plugs into the formula.
 *
 * Deliberately NOT everything in the model is exposed here: the grass
 * ground-truth formula's own weights (turf multiplier, seed-valley bonus,
 * arid weight -- see docs/allergy-scoring.md) and the county-grid turf model
 * (data/county-grid-methodology.md) are pre-computed at build time into
 * static JSON, not run live in the browser. Making those tunable live would
 * mean re-deriving them from raw inputs client-side -- a real, honest
 * architecture change, not attempted in this pass. What's exposed here is
 * everything that genuinely does run live already.
 */
export interface ModelSettings {
  /** IDW interpolation power (lib/heatmap/interpolate.ts): higher values hug
   * closer to each sample point (more distinct regional blobs); lower values
   * blend more smoothly across the whole map. */
  idwPower: number;
  /** Per-layer opacity when 2+ allergens overlap (components/UsMap.tsx). */
  layerOpacity: number;
  /** Mode 2's combination formula (lib/severity/composite.ts): "noisy-or"
   * treats sensitivities as compounding independent risks (the shipped
   * default); "average" is a simple sensitivity-weighted mean instead. */
  combinationMethod: "noisy-or" | "average";
  /** Season-position curve strength (lib/severity/season.ts): 1 = the full
   * modeled seasonality; 0 = flat, no seasonality at all. */
  seasonStrength: number;
}

export const DEFAULT_MODEL_SETTINGS: ModelSettings = {
  idwPower: 2.5,
  layerOpacity: 0.65,
  combinationMethod: "noisy-or",
  seasonStrength: 1,
};
