import { describe, expect, it } from "vitest";
import allergensData from "@data/allergens.json";
import cities from "@data/cities.json";

describe("data/allergens.json integrity", () => {
  const cityIds = new Set(cities.map((c) => c.id));

  it("every allergen has required fields and a valid confidence value", () => {
    for (const allergen of allergensData.allergens) {
      expect(allergen.id).toBeTruthy();
      expect(allergen.label).toBeTruthy();
      expect(["grass", "weed", "tree", "mold"]).toContain(allergen.category);
      expect(["validated", "modeled"]).toContain(allergen.confidence);
    }
  });

  it("no NAB-derived confidence: every entry here is modeled, not validated", () => {
    // This file covers only the comprehensive-expansion allergens (story s3).
    // Grass's validated data lives separately in data/allergy-scores.json.
    for (const allergen of allergensData.allergens) {
      expect(allergen.confidence).toBe("modeled");
    }
  });

  it("mold entries are present and clearly categorized", () => {
    const moldEntries = allergensData.allergens.filter((a) => a.category === "mold");
    expect(moldEntries.length).toBeGreaterThan(0);
    for (const mold of moldEntries) {
      expect(mold.confidence).toBe("modeled");
    }
  });

  it("has no orphan city references — every score references a real city id", () => {
    for (const score of allergensData.scores) {
      expect(cityIds.has(score.city_id)).toBe(true);
    }
  });

  it("has a complete score matrix: every allergen scored for every city", () => {
    const allergenIds = allergensData.allergens.map((a) => a.id);
    const scoreKeys = new Set(
      allergensData.scores.map((s) => `${s.allergen_id}::${s.city_id}`),
    );
    for (const allergenId of allergenIds) {
      for (const city of cities) {
        expect(scoreKeys.has(`${allergenId}::${city.id}`)).toBe(true);
      }
    }
  });

  it("comprehensively exceeds the original 15-species list", () => {
    expect(allergensData.allergens.length).toBeGreaterThan(15);
  });
});
