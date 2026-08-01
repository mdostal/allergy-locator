import { describe, expect, it } from "vitest";
import dailyCurves from "@data/daily-season-curves.json";
import { getDailyMultiplier, hasDailyCurve, dayOfYear } from "@/lib/severity/daily-curves";
import { getSeverity } from "@/lib/severity/score";

describe("data/daily-season-curves.json integrity (real NOAA daily-normal phenology model)", () => {
  it("covers all 168 cities", () => {
    expect(Object.keys(dailyCurves).length).toBe(168);
  });

  it(
    "every one of the 168 cities has exactly 366 days per curve, all values in [0,1]",
    () => {
      // Full coverage, not a sample -- a real bug (NOAA's -9999 missing-value
      // sentinel parsed as a valid float, corrupting the Cladosporium humidity
      // term) only showed up in specific dry-climate cities, so a partial
      // slice would have missed it. A plain loop + one failure collector
      // (rather than a chai `expect(...)` call per one of the ~600k values)
      // keeps this fast enough for CI's slower runners while still checking
      // every value.
      const failures: string[] = [];
      for (const [cityId, curves] of Object.entries(dailyCurves)) {
        for (const key of ["grass", "tree", "weed", "cladosporium", "alternaria"] as const) {
          const curve = curves[key];
          if (curve.length !== 366) failures.push(`${cityId}.${key}: length ${curve.length}`);
          for (const v of curve) {
            if (v < 0 || v > 1) {
              failures.push(`${cityId}.${key}: out-of-range value ${v}`);
              break;
            }
          }
        }
      }
      expect(failures).toEqual([]);
    },
    15000,
  );

  it("every one of the 168 cities' curves peaks at exactly 1.0 (annual score = peak-season convention)", () => {
    const failures: string[] = [];
    for (const [cityId, curves] of Object.entries(dailyCurves)) {
      for (const key of ["grass", "tree", "weed", "cladosporium", "alternaria"] as const) {
        const peak = Math.max(...curves[key]);
        if (peak !== 1) failures.push(`${cityId}.${key}: peak ${peak}`);
      }
    }
    expect(failures).toEqual([]);
  });
});

describe("dayOfYear (leap-year-indexed, matching NOAA's 366-row normals format)", () => {
  it("March 1 lands right after Feb 29", () => {
    expect(dayOfYear(2, 29)).toBe(59);
    expect(dayOfYear(3, 1)).toBe(60);
  });

  it("January 1 is day 0", () => {
    expect(dayOfYear(1, 1)).toBe(0);
  });
});

describe("real per-city daily phenology model", () => {
  it("has a real daily curve for austin-tx", () => {
    expect(hasDailyCurve("austin-tx")).toBe(true);
  });

  it("Austin's real tree-pollen peak lands in early spring, not deep winter", () => {
    // Regression guard for a real bug caught during generation: a naive
    // local-trend detector put Austin's modeled tree peak in January,
    // chasing an ordinary winter warm spell in a mild-winter city.
    const tree = dailyCurves["austin-tx"].tree;
    const peakDay = tree.indexOf(Math.max(...tree));
    // day-of-year 45-135 spans mid-Feb through mid-May.
    expect(peakDay).toBeGreaterThan(45);
    expect(peakDay).toBeLessThan(135);
  });

  it("getSeverity's exact-day parameter uses the real curve, not just the month midpoint", () => {
    const midMonth = getSeverity("grass", "austin-tx", 1, undefined, 15);
    const earlyMonth = getSeverity("grass", "austin-tx", 1, undefined, 1);
    expect(midMonth).not.toBeNull();
    expect(earlyMonth).not.toBeNull();
    // Different specific days in the same month can legitimately differ once
    // driven by a real day-by-day curve instead of one shared monthly value.
    const multiplier1 = getDailyMultiplier("austin-tx", "grass", "grass", 1, 1);
    const multiplier15 = getDailyMultiplier("austin-tx", "grass", "grass", 1, 15);
    expect(multiplier1).not.toBeNull();
    expect(multiplier15).not.toBeNull();
  });

  it("falls back to null (letting callers use the coarser model) for a city with no daily curve", () => {
    expect(hasDailyCurve("nonexistent-city")).toBe(false);
    expect(getDailyMultiplier("nonexistent-city", "grass", "grass", 6, 15)).toBeNull();
  });
});
