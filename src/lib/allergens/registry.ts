/**
 * The allergen registry is the single source of truth for which allergens the app
 * knows about. UI components (toggle list, sensitivity sliders, palette) MUST loop
 * over this array — never hardcode a per-allergen component. Story s2 proves the
 * pattern with one entry (grass); story s4 extends this array from the comprehensive
 * dataset sourced in s3 without touching any UI component.
 */

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
  /** Base hue for this allergen's gradient overlay (Mode 1). */
  color: string;
}

export const ALLERGENS: AllergenDef[] = [
  {
    id: "grass",
    label: "Grass",
    category: "grass",
    confidence: "validated",
    color: "#16a34a",
  },
];

export function getAllergen(id: string): AllergenDef | undefined {
  return ALLERGENS.find((a) => a.id === id);
}
