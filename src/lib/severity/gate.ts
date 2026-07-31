import grassScores from "@data/allergy-scores.json";
import allergensData from "@data/allergens.json";

const grassScoreIndex = new Map(grassScores.map((entry) => [entry.id, entry]));

const comprehensiveIndex = new Map(
  allergensData.scores.map((s) => [`${s.allergen_id}::${s.city_id}`, s]),
);

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
  return comprehensiveIndex.has(`${allergenId}::${cityId}`);
}
