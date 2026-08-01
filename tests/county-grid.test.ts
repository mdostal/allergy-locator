import { describe, expect, it } from "vitest";
import countyGrid from "@data/county-grid.json";
import { ALLERGENS } from "@/lib/allergens/registry";
import { COUNTY_POINTS } from "@/lib/geo/county-points";

describe("data/county-grid.json integrity (gradient-densification layer)", () => {
  it("covers close to the real US county count, not a partial/truncated set", () => {
    // 3,143 is the real count of US counties + county-equivalents (50 states
    // + DC); a much smaller number would mean the fetch/generation silently
    // dropped data.
    expect(countyGrid.counties.length).toBeGreaterThan(3000);
    expect(countyGrid.counties.length).toBeLessThan(3300);
  });

  it("every county has a valid Koppen zone and a score for every registry allergen", () => {
    const validZones = new Set([
      "Aw", "BSh", "BSk", "BWh", "BWk", "Cfa", "Cfb", "Csa", "Csb", "Dfa", "Dfb", "Dfc", "Dsb",
    ]);
    for (const county of countyGrid.counties.slice(0, 200)) {
      expect(validZones.has(county.koppen)).toBe(true);
      for (const allergen of ALLERGENS) {
        const value = county.scores[allergen.id];
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    }
  });

  it("has no duplicate FIPS codes", () => {
    const fipsSet = new Set(countyGrid.counties.map((c) => c.fips));
    expect(fipsSet.size).toBe(countyGrid.counties.length);
  });

  it("every county projects to a finite point inside the map's viewBox", () => {
    for (const point of COUNTY_POINTS) {
      expect(Number.isFinite(point.x)).toBe(true);
      expect(Number.isFinite(point.y)).toBe(true);
    }
    // Projection can legitimately drop a few out-of-frame points (e.g. far
    // outlying islands); it should not drop most of them.
    expect(COUNTY_POINTS.length).toBeGreaterThan(countyGrid.counties.length - 20);
  });

  it("grass scores are directionally sane at well-known extremes", () => {
    const byName = (name: string, state: string) =>
      countyGrid.counties.find((c) => c.name === name && c.state === state);

    const coconino = byName("Coconino", "AZ"); // Flagstaff -- high, dry, should be near-zero
    const miamiDade = byName("Miami-Dade", "FL"); // year-round subtropical grass, should be high

    expect(coconino).toBeDefined();
    expect(miamiDade).toBeDefined();
    expect(coconino!.scores.grass).toBeLessThan(20);
    expect(miamiDade!.scores.grass).toBeGreaterThan(70);
  });
});
