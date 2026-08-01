import { describe, expect, it } from "vitest";
import { getSeverity } from "@/lib/severity/score";
import { getComposite } from "@/lib/severity/composite";
import { seasonMultiplier, zoneGroupFor } from "@/lib/severity/season";

describe("season-position scoring (story s6)", () => {
  it("omitting month returns the exact unmodified annual score (backward compatible)", () => {
    const annual = getSeverity("grass", "austin-tx");
    expect(annual?.value).toBe(91);
    expect(annual?.tier).toBe("worst");
  });

  it("peak-month score for a warm-temperate grass city matches the annual peak", () => {
    // Austin (Cfa -> zone group C) peaks in July at multiplier 1.0.
    const july = getSeverity("grass", "austin-tx", 7);
    expect(july?.value).toBe(91);
  });

  it("off-season month scores far lower than the annual peak for the same city", () => {
    const january = getSeverity("grass", "austin-tx", 1);
    expect(january).not.toBeNull();
    expect(january!.value).toBeLessThan(10);
    expect(january!.tier).toBe("near-zero");
  });

  it("alternaria uses the same flat calendar curve regardless of climate zone", () => {
    const zoneA = zoneGroupFor("Aw");
    const zoneD = zoneGroupFor("Dfb");
    expect(zoneA).not.toBe(zoneD);
    expect(seasonMultiplier("alternaria", "mold", "Aw", 8)).toBe(
      seasonMultiplier("alternaria", "mold", "Dfb", 8),
    );
  });

  it("cladosporium's curve does vary by climate zone, unlike alternaria's", () => {
    const tropical = seasonMultiplier("cladosporium", "mold", "Aw", 1);
    const continental = seasonMultiplier("cladosporium", "mold", "Dfb", 1);
    expect(tropical).not.toBe(continental);
  });

  it("Advanced mode: seasonStrength 0 flattens the curve to no seasonality at all", () => {
    // Austin's January multiplier is normally ~0.05 (near-zero); at strength 0
    // every month must read exactly like the unmodified annual/peak score.
    expect(seasonMultiplier("grass", "grass", "Cfa", 1, 0)).toBe(1);
    const flatJanuary = getSeverity("grass", "austin-tx", 1, 0);
    const annual = getSeverity("grass", "austin-tx");
    expect(flatJanuary?.value).toBe(annual?.value);
  });

  it("Advanced mode: seasonStrength between 0 and 1 interpolates linearly", () => {
    const full = seasonMultiplier("grass", "grass", "Cfa", 1, 1);
    const half = seasonMultiplier("grass", "grass", "Cfa", 1, 0.5);
    const none = seasonMultiplier("grass", "grass", "Cfa", 1, 0);
    expect(none).toBe(1);
    expect(half).toBeCloseTo((full + none) / 2, 5);
  });

  it("composite score for a month threads through to every contributing allergen", () => {
    const annual = getComposite({ grass: 100 }, "austin-tx");
    const january = getComposite({ grass: 100 }, "austin-tx", 1);
    expect(annual).not.toBeNull();
    expect(january).not.toBeNull();
    expect(january!.value).toBeLessThan(annual!.value);
  });
});
