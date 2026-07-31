/**
 * The allergen registry is the single source of truth for which allergens the app
 * knows about. UI components (toggle list, sensitivity sliders, palette) MUST loop
 * over this array — never hardcode a per-allergen component. Story s2 proved the
 * pattern with one entry (grass); this file now loads the comprehensive dataset
 * sourced in story s3 (data/allergens.json) with zero changes needed to any
 * component that consumes ALLERGENS.
 */
import allergensData from "@data/allergens.json";
import { baseColorForIndex } from "@/lib/severity/palette";

export type AllergenConfidence = "validated" | "modeled";
export type AllergenCategory = "grass" | "weed" | "tree" | "mold";

export interface AllergenDef {
  id: string;
  label: string;
  category: AllergenCategory;
  /**
   * "validated" = fit against real, lived ground-truth reactions (currently only
   * grass, MAE 2.3 per data/allergy-scoring.md). "modeled" = a good-faith extension
   * of the same method without an equivalent ground-truth fit yet. Never flatten
   * this distinction in the UI.
   */
  confidence: AllergenConfidence;
  /** Base hue for this allergen's sequential severity ramp (Mode 1). Derived from
   * registry position, not hand-picked — see lib/severity/palette.ts. */
  color: string;
}

const TOTAL_COUNT = allergensData.allergens.length + 1; // +1 for grass

const GRASS: AllergenDef = {
  id: "grass",
  label: "Grass",
  category: "grass",
  confidence: "validated",
  color: baseColorForIndex(0, TOTAL_COUNT),
};

const COMPREHENSIVE: AllergenDef[] = allergensData.allergens.map((a, i) => ({
  id: a.id,
  label: a.label,
  category: a.category as AllergenCategory,
  confidence: a.confidence as AllergenConfidence,
  // +1 so grass keeps index 0's pinned hue and every sourced allergen still gets
  // an order-preserving hue derived from its fixed position in the data file,
  // evenly spaced around the full circle given the known total count.
  color: baseColorForIndex(i + 1, TOTAL_COUNT),
}));

export const ALLERGENS: AllergenDef[] = [GRASS, ...COMPREHENSIVE];

export function getAllergen(id: string): AllergenDef | undefined {
  return ALLERGENS.find((a) => a.id === id);
}
