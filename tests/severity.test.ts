import { describe, expect, it } from "vitest";
import { ALLERGENS } from "@/lib/allergens/registry";
import { hasAllergen } from "@/lib/severity/gate";
import { getSeverity } from "@/lib/severity/score";

describe("allergen registry", () => {
  it("contains grass, the flagship validated allergen", () => {
    const grass = ALLERGENS.find((a) => a.id === "grass");
    expect(grass).toBeDefined();
    expect(grass?.confidence).toBe("validated");
  });

  it("comprehensively exceeds the original 15-species list (story s3/s4)", () => {
    expect(ALLERGENS.length).toBeGreaterThan(15);
  });

  it("every non-grass allergen is confidence: modeled, never validated", () => {
    for (const allergen of ALLERGENS) {
      if (allergen.id === "grass") continue;
      expect(allergen.confidence).toBe("modeled");
    }
  });

  it("includes at least one mold entry", () => {
    expect(ALLERGENS.some((a) => a.category === "mold")).toBe(true);
  });
});

describe("grass severity — ground-truth oracle (data/allergy-scoring.md)", () => {
  const cases: Array<[string, string]> = [
    ["flagstaff-az", "near-zero"],
    ["rapid-city-sd", "near-zero"],
    ["sundance-wy", "near-zero"],
    ["omaha-ne", "low"],
    ["kalispell-mt", "low"],
    ["salt-lake-city-ut", "moderate"],
    ["colorado-springs-co", "moderate"],
    ["carlsbad-nm", "high"],
    ["mesa-az", "high"],
    ["boise-id", "high"],
    ["austin-tx", "worst"],
  ];

  it.each(cases)("scores %s as %s", (cityId, expectedTier) => {
    expect(hasAllergen("grass", cityId)).toBe(true);
    const result = getSeverity("grass", cityId);
    expect(result).not.toBeNull();
    expect(result?.tier).toBe(expectedTier);
    expect(result?.confidence).toBe("validated");
  });

  it("returns a plain-English why and component breakdown", () => {
    const result = getSeverity("grass", "austin-tx");
    expect(result?.why).toBeTruthy();
    expect(result?.components).toBeDefined();
    expect(Object.keys(result?.components ?? {})).toEqual([
      "base_season_climate",
      "turf_boost",
      "arid_weed",
      "elevation_discount",
      "coastal_nudge",
    ]);
  });

  it("returns null for an allergen with no gate/data", () => {
    expect(getSeverity("nonexistent-allergen", "austin-tx")).toBeNull();
  });
});

describe("comprehensive allergen severity — plausibility (story s4, not ground-truth)", () => {
  it("sagebrush scores high in arid Phoenix and near-zero in humid New York", () => {
    const phoenix = getSeverity("sagebrush", "phoenix-az");
    const nyc = getSeverity("sagebrush", "new-york-ny");
    expect(phoenix?.confidence).toBe("modeled");
    expect(phoenix?.value ?? 0).toBeGreaterThan(nyc?.value ?? 0);
    expect(nyc?.tier).toBe("near-zero");
  });

  it("red alder is present in Pacific NW Seattle but not in humid-subtropical Houston", () => {
    expect(hasAllergen("red-alder", "seattle-wa")).toBe(true);
    const seattle = getSeverity("red-alder", "seattle-wa");
    const houston = getSeverity("red-alder", "houston-tx");
    expect(seattle?.value ?? 0).toBeGreaterThan(houston?.value ?? 0);
  });

  it("Cladosporium (humidity-driven mold) scores higher in humid Houston than arid Phoenix", () => {
    const houston = getSeverity("cladosporium", "houston-tx");
    const phoenix = getSeverity("cladosporium", "phoenix-az");
    expect(houston?.confidence).toBe("modeled");
    expect(houston?.value ?? 0).toBeGreaterThan(phoenix?.value ?? 0);
  });
});
