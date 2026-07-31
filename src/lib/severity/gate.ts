import grassScores from "@data/allergy-scores.json";

const grassScoreIndex = new Map(grassScores.map((entry) => [entry.id, entry]));

/**
 * Presence gate: does this allergen occur at all in this city? This is deliberately
 * separate from severity (MODEL-NOTES.md: "presence = gate, severity = color") — a
 * city can gate `true` for an allergen while still scoring low if the season/climate
 * doesn't favor it.
 */
export function hasAllergen(allergenId: string, cityId: string): boolean {
  if (allergenId === "grass") {
    return grassScoreIndex.has(cityId);
  }
  return false;
}
