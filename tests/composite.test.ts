import { describe, expect, it } from "vitest";
import { getComposite } from "@/lib/severity/composite";
import { getSeverity } from "@/lib/severity/score";
import authorPreset from "@data/presets/author.json";

describe("Mode 2 — personalized composite", () => {
  it("returns null when every sensitivity is zero (no false 'perfect everywhere' green)", () => {
    expect(getComposite({}, "austin-tx")).toBeNull();
    expect(getComposite({ grass: 0 }, "austin-tx")).toBeNull();
  });

  it("reduces to a single allergen's own severity when only it is active", () => {
    const grassOnly = getComposite({ grass: 100 }, "austin-tx");
    const grassSeverity = getSeverity("grass", "austin-tx");
    expect(grassOnly?.value).toBe(grassSeverity?.value);
  });

  it("blends two active allergens using compounding (noisy-OR), not dilution", () => {
    const composite = getComposite({ grass: 90, pigweed: 40 }, "austin-tx");
    const grassOnly = getComposite({ grass: 90 }, "austin-tx");
    expect(composite).not.toBeNull();
    // Real allergy exposure compounds: adding a second nonzero-severity,
    // nonzero-sensitivity allergen must never DECREASE the blended score below
    // what the single dominant allergen alone would produce -- averaging it down
    // would understate how a multi-allergen reaction actually feels.
    expect(composite!.value).toBeGreaterThanOrEqual(grassOnly!.value);
  });

  it("author's example preset produces a recognizable grass-dominant result", () => {
    // Austin is grass-belt "worst" tier (91) in the validated data -- the author's
    // real panel (heavy grass, moderate weeds, quiet boxelder) should land high.
    const austin = getComposite(authorPreset.sensitivities, "austin-tx");
    expect(austin).not.toBeNull();
    expect(austin!.value).toBeGreaterThan(65);

    // Wyoming/Black Hills region is the author's own documented best-air region
    // (docs/story/MY-ANSWER.md) -- grass alone is near-zero (13) there. The
    // weed/tree layers are coarser, modeled-only estimates (data/allergens-
    // scoring.md's documented limitation), so the composite won't be as clean a
    // near-zero as the grass-only model achieves -- the meaningful, robust
    // assertion is that it's still clearly BETTER than the grass-belt South, not
    // an exact absolute floor.
    const sundance = getComposite(authorPreset.sensitivities, "sundance-wy");
    expect(sundance).not.toBeNull();
    expect(sundance!.value).toBeLessThan(austin!.value);
    expect(sundance!.value).toBeLessThan(50);
  });

  it("Advanced mode: combinationMethod 'average' is a genuinely different, live-computed alternative", () => {
    const noisyOr = getComposite({ grass: 90, pigweed: 40 }, "austin-tx");
    const average = getComposite({ grass: 90, pigweed: 40 }, "austin-tx", undefined, {
      combinationMethod: "average",
    });
    expect(noisyOr).not.toBeNull();
    expect(average).not.toBeNull();
    expect(average!.value).not.toBe(noisyOr!.value);
    // The weighted average of a strong signal and a weaker one sits below the
    // compounding noisy-OR result -- this is the "dilution" composite.ts's own
    // docstring explicitly rejects as the default, now available as an
    // explicit, honestly-labeled opt-in instead.
    expect(average!.value).toBeLessThan(noisyOr!.value);
  });

  it("lists contributions sorted by weighted impact", () => {
    const composite = getComposite(
      { grass: 90, pigweed: 40 },
      "austin-tx",
    );
    expect(composite?.contributions.length).toBe(2);
    expect(composite?.contributions[0].allergenId).toBe("grass");
  });
});
