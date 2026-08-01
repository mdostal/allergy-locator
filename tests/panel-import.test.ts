import { describe, expect, it } from "vitest";
import { matchAllergenName, classToSensitivity } from "@/lib/panel-import/match-allergen";
import { parseCsv } from "@/lib/panel-import/parse-csv";

describe("matchAllergenName (fit-gap fuzzy matching)", () => {
  it("matches a registry label exactly (case-insensitive)", () => {
    expect(matchAllergenName("Tall Fescue")).toEqual({ allergenId: "tall-fescue", confidence: "exact" });
    expect(matchAllergenName("cladosporium (mold)")).toEqual({ allergenId: "cladosporium", confidence: "exact" });
  });

  it("matches a registry id directly", () => {
    expect(matchAllergenName("red-oak")).toEqual({ allergenId: "red-oak", confidence: "exact" });
  });

  it("matches common lab-report species names via the alias table", () => {
    expect(matchAllergenName("Bermuda Grass")).toEqual({ allergenId: "grass", confidence: "alias" });
    expect(matchAllergenName("Timothy")).toEqual({ allergenId: "grass", confidence: "alias" });
    expect(matchAllergenName("Short Ragweed")).toEqual({ allergenId: "ragweed", confidence: "alias" });
    expect(matchAllergenName("Oak, Red")).toEqual({ allergenId: "red-oak", confidence: "alias" });
  });

  it("matches with a lab panel code suffix via loose containment", () => {
    const result = matchAllergenName("Bermuda Grass (t7)");
    expect(result.allergenId).toBe("grass");
  });

  it("returns a real gap (null) for an allergen this app doesn't model", () => {
    expect(matchAllergenName("Dust Mite")).toEqual({ allergenId: null, confidence: null });
    expect(matchAllergenName("Cat Dander")).toEqual({ allergenId: null, confidence: null });
  });
});

describe("classToSensitivity (0-6 immunoassay class -> 0-100 scale)", () => {
  it("maps the documented class boundaries", () => {
    expect(classToSensitivity(0)).toBe(0);
    expect(classToSensitivity(3)).toBe(45);
    expect(classToSensitivity(6)).toBe(100);
  });

  it("clamps out-of-range class values instead of producing a nonsense sensitivity", () => {
    expect(classToSensitivity(-1)).toBe(0);
    expect(classToSensitivity(9)).toBe(100);
  });
});

describe("parseCsv", () => {
  it("parses a headered CSV with class scores", () => {
    const csv = "Allergen,Class\nBermuda Grass,4\nShort Ragweed,0\nDust Mite,2";
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toMatchObject({ rawName: "Bermuda Grass", allergenId: "grass", sensitivity: 60 });
    expect(rows[1]).toMatchObject({ allergenId: "ragweed", sensitivity: 0 });
    expect(rows[2]).toMatchObject({ allergenId: null }); // real gap: not modeled, needs manual pick
  });

  it("parses a header-less two-column file", () => {
    const csv = "Tall Fescue,55\nRed Oak,20";
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ allergenId: "tall-fescue", sensitivity: 55 });
  });

  it("treats a value > 6 as a direct 0-100 sensitivity, not a class score", () => {
    const csv = "Tall Fescue,55";
    const rows = parseCsv(csv);
    expect(rows[0].sensitivity).toBe(55); // NOT classToSensitivity(55)
  });

  it("returns an empty array for an empty file rather than throwing", () => {
    expect(parseCsv("")).toEqual([]);
    expect(parseCsv("   \n  \n")).toEqual([]);
  });

  it("handles quoted CSV fields containing commas", () => {
    const csv = 'Name,Value\n"Ragweed, Short",5';
    const rows = parseCsv(csv);
    expect(rows[0].rawName).toBe("Ragweed, Short");
    expect(rows[0].allergenId).toBe("ragweed");
  });
});
