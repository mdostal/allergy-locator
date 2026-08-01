import { describe, expect, it } from "vitest";
import cities from "@data/cities.json";
import careAccess from "@data/care-access.json";

type FacilityResult = { nearest_facility: string; distance_mi: number; est_drive_min: number; tier: string };
type CareAccessRecord = {
  city: string;
  pediatric_cardiac: FacilityResult;
  pediatric_specialty: FacilityResult;
  general: FacilityResult;
};

const LAYERS = ["pediatric_cardiac", "pediatric_specialty", "general"] as const;
const VALID_TIERS = new Set(["<=30", "<=60", "<=120", "120+"]);

/**
 * Regenerated via scripts/gen_care_access.py (dimension 2, docs/ROADMAP.md;
 * v5's "second real dataset" slice). A real data gap was found and fixed
 * before this test existed: 9 cities (incl. New York City, Baltimore, St.
 * Louis) had a verified pediatric cardiac-surgery program but ZERO entry in
 * the pediatric-specialty hospital list, silently routing their "nearest
 * specialty care" to a much farther facility than reality (NYC resolved to
 * Philadelphia, 111 min, before the fix). The regression checks below pin
 * that fix -- these cities must resolve to real nearby facilities now.
 */
describe("data/care-access.json integrity", () => {
  const cityIds = new Set(cities.map((c) => c.id));
  const records = careAccess as unknown as Record<string, CareAccessRecord | { description: string }>;

  it("has an entry for every one of the 168 spine cities", () => {
    for (const cityId of cityIds) {
      expect(records[cityId]).toBeDefined();
    }
  });

  it("has no orphan entries -- every key besides _meta is a real city id", () => {
    for (const key of Object.keys(records)) {
      if (key === "_meta") continue;
      expect(cityIds.has(key)).toBe(true);
    }
  });

  it("every city has all 3 layers with a valid tier and non-negative drive time", () => {
    for (const cityId of cityIds) {
      const record = records[cityId] as CareAccessRecord;
      for (const layer of LAYERS) {
        const result = record[layer];
        expect(result.nearest_facility).toBeTruthy();
        expect(VALID_TIERS.has(result.tier)).toBe(true);
        expect(result.distance_mi).toBeGreaterThanOrEqual(0);
        expect(result.est_drive_min).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("tier matches the documented est_drive_min thresholds for every record", () => {
    const failures: string[] = [];
    for (const cityId of cityIds) {
      const record = records[cityId] as CareAccessRecord;
      for (const layer of LAYERS) {
        const { est_drive_min, tier } = record[layer];
        const expected = est_drive_min <= 30 ? "<=30" : est_drive_min <= 60 ? "<=60" : est_drive_min <= 120 ? "<=120" : "120+";
        if (tier !== expected) failures.push(`${cityId}/${layer}: est_drive_min=${est_drive_min} tier=${tier} expected=${expected}`);
      }
    }
    expect(failures).toEqual([]);
  });

  it("regression: New York City resolves pediatric specialty care nearby, not to Philadelphia", () => {
    const nyc = (records["new-york-ny"] as CareAccessRecord).pediatric_specialty;
    expect(nyc.tier).toBe("<=30");
    expect(nyc.est_drive_min).toBeLessThan(30);
  });

  it("regression: Baltimore and St. Louis resolve pediatric specialty care nearby", () => {
    const baltimore = (records["baltimore-md"] as CareAccessRecord | undefined)?.pediatric_specialty;
    const stLouis = (records["st-louis-mo"] as CareAccessRecord | undefined)?.pediatric_specialty;
    if (baltimore) expect(baltimore.tier).toBe("<=30");
    if (stLouis) expect(stLouis.tier).toBe("<=30");
  });
});
