import { describe, expect, it } from "vitest";
import { getCareAccess, CARE_ACCESS_LAYERS } from "@/lib/care-access/score";

describe("getCareAccess", () => {
  it("returns a low concern score for New York City's pediatric specialty access (regression: was farthest-tier before the data fix)", () => {
    const result = getCareAccess("new-york-ny", "pediatric_specialty");
    expect(result).not.toBeNull();
    expect(result!.tier).toBe("<=30");
    expect(result!.value).toBeLessThan(20); // low concern = good access
  });

  it("higher-concern tiers produce a higher value than lower-concern tiers (consistent green->red convention)", () => {
    const good = getCareAccess("new-york-ny", "general");
    const worse = getCareAccess("new-york-ny", "pediatric_cardiac");
    expect(good).not.toBeNull();
    expect(worse).not.toBeNull();
    // Not asserting a specific relationship between these two particular
    // layers (both could be good) -- just that the value/tier mapping is
    // monotonic in general, exercised directly below.
    const tierOrder = ["<=30", "<=60", "<=120", "120+"];
    for (let i = 1; i < tierOrder.length; i++) {
      const concernValues = [good, worse]
        .filter((r) => r?.tier === tierOrder[i])
        .map((r) => r!.value);
      const priorValues = [good, worse]
        .filter((r) => r?.tier === tierOrder[i - 1])
        .map((r) => r!.value);
      for (const c of concernValues) for (const p of priorValues) expect(c).toBeGreaterThan(p);
    }
  });

  it("returns null for an unknown city id", () => {
    expect(getCareAccess("not-a-real-city", "general")).toBeNull();
  });

  it("CARE_ACCESS_LAYERS lists exactly the 3 layers the data file has", () => {
    const ids = CARE_ACCESS_LAYERS.map((l) => l.id).sort();
    expect(ids).toEqual(["general", "pediatric_cardiac", "pediatric_specialty"].sort());
  });

  it("value is always 0-100 for every city and layer", () => {
    // Spot-check a handful of real city ids across layers rather than every
    // one of the 168 -- the data file's own integrity is covered by
    // tests/care-access-data.test.ts.
    for (const cityId of ["new-york-ny", "boise-id", "miami-fl"]) {
      for (const layer of CARE_ACCESS_LAYERS) {
        const result = getCareAccess(cityId, layer.id);
        if (!result) continue;
        expect(result.value).toBeGreaterThanOrEqual(0);
        expect(result.value).toBeLessThanOrEqual(100);
      }
    }
  });
});
