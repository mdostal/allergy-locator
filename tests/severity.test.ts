import { describe, expect, it } from "vitest";
import { ALLERGENS } from "@/lib/allergens/registry";
import { hasAllergen } from "@/lib/severity/gate";
import { getSeverity } from "@/lib/severity/score";

describe("allergen registry (story s2 architecture proof)", () => {
  it("contains grass, the flagship validated allergen", () => {
    const grass = ALLERGENS.find((a) => a.id === "grass");
    expect(grass).toBeDefined();
    expect(grass?.confidence).toBe("validated");
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
