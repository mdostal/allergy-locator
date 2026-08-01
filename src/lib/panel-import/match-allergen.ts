import { ALLERGENS } from "@/lib/allergens/registry";

/**
 * "Fit-gap" fuzzy matching (v2 kickoff): a real allergy test report names
 * allergens by lab/common name ("Bermuda Grass", "Ragweed, Short", "Oak,
 * Red"), not this app's internal ids. This normalizes and matches against
 * both the registry's own labels AND a small alias table of common
 * synonyms/species names that map to this app's (deliberately coarser, for
 * grass) categories -- filling what can be confidently matched
 * automatically ("fit"), and leaving anything ambiguous or unrecognized for
 * the user to manually assign ("gap"), per explicit user direction: "auto
 * try to fitgap -- fill and match and let people fix it if needed."
 */

// Common lab-report species/synonyms that don't literally match a registry
// label but should confidently resolve to one of our ids. Grass species not
// individually modeled (Bermuda, Bahia, Johnson, Rye, Timothy, Kentucky Blue,
// etc.) all roll up to the validated "grass" umbrella -- consistent with how
// the app's own grass model already treats grass as one combined category.
const ALIASES: Record<string, string> = {
  "bermuda grass": "grass",
  "bermuda": "grass",
  "bahia grass": "grass",
  "bahia": "grass",
  "johnson grass": "grass",
  "johnsongrass": "grass",
  "rye grass": "grass",
  "ryegrass": "grass",
  "perennial rye": "grass",
  "timothy grass": "grass",
  "timothy": "grass",
  "kentucky bluegrass": "grass",
  "bluegrass": "grass",
  "bermuda/bahia": "grass",
  "june grass": "grass",
  "meadow fescue": "tall-fescue",
  "fescue": "tall-fescue",
  "vernal grass": "sweet-vernal-grass",
  "russian thistle": "kochia-russian-thistle",
  "kochia": "kochia-russian-thistle",
  "sheep sorrel": "dock-sorrel",
  "yellow dock": "dock-sorrel",
  "sorrel": "dock-sorrel",
  "short ragweed": "ragweed",
  "giant ragweed": "ragweed",
  "ragweed, short": "ragweed",
  "ragweed, giant": "ragweed",
  "redroot pigweed": "pigweed",
  "pigweed": "pigweed",
  "lamb's quarters": "lambsquarters",
  "lambs quarters": "lambsquarters",
  "goosefoot": "lambsquarters",
  "english plantain": "plantain",
  "plantain, english": "plantain",
  "oak, red": "red-oak",
  "oak, live": "live-oak",
  "ash, white": "white-ash",
  "maple, red": "red-maple",
  "pine, loblolly": "loblolly-pine",
  "walnut, black": "black-walnut",
  "sycamore": "american-sycamore",
  "alder, red": "red-alder",
  "hickory, shagbark": "shagbark-hickory",
  "elm, american": "american-elm",
  "cedar": "cedar-juniper",
  "juniper": "cedar-juniper",
  "mountain cedar": "cedar-juniper",
  "birch, river": "river-birch",
  "box elder": "boxelder",
  "cladosporium herbarum": "cladosporium",
  "alternaria alternata": "alternaria",
  "alternaria tenuis": "alternaria",
};

function normalize(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[().]/g, "")
    .replace(/\s+/g, " ");
}

export interface MatchResult {
  allergenId: string | null;
  /** "exact" (registry id or label matched verbatim), "alias" (matched a
   * known synonym), or null (no confident match -- a real "gap" for the
   * user to fill in manually). */
  confidence: "exact" | "alias" | null;
}

const LABEL_TO_ID = new Map(ALLERGENS.map((a) => [normalize(a.label), a.id]));
const ID_SET = new Set(ALLERGENS.map((a) => a.id));

export function matchAllergenName(rawName: string): MatchResult {
  const normalized = normalize(rawName);

  if (ID_SET.has(normalized)) return { allergenId: normalized, confidence: "exact" };

  const byLabel = LABEL_TO_ID.get(normalized);
  if (byLabel) return { allergenId: byLabel, confidence: "exact" };

  if (ALIASES[normalized]) return { allergenId: ALIASES[normalized], confidence: "alias" };

  // Loose containment match as a last resort (e.g. "Bermuda Grass (t7)" with
  // a lab panel code suffix) -- still "alias" confidence, never silently
  // "exact," since this is a heuristic, not a verified identity.
  for (const [alias, id] of Object.entries(ALIASES)) {
    if (normalized.includes(alias)) return { allergenId: id, confidence: "alias" };
  }
  for (const [label, id] of LABEL_TO_ID) {
    if (normalized.includes(label) || label.includes(normalized)) {
      return { allergenId: id, confidence: "alias" };
    }
  }

  return { allergenId: null, confidence: null };
}

/**
 * Real allergy immunoassay reports commonly grade reactions on a standard
 * "class" scale (0 = negative/undetectable through 6 = very high), not a
 * 0-100 severity directly. This maps that standard scale onto this app's
 * 0-100 sensitivity scale -- a defensible, documented, EDITABLE default
 * (the review UI lets the user correct any row), not a claimed precise
 * conversion.
 */
const CLASS_TO_SENSITIVITY: Record<number, number> = {
  0: 0,
  1: 15,
  2: 30,
  3: 45,
  4: 60,
  5: 80,
  6: 100,
};

export function classToSensitivity(classValue: number): number {
  const clamped = Math.max(0, Math.min(6, Math.round(classValue)));
  return CLASS_TO_SENSITIVITY[clamped];
}
