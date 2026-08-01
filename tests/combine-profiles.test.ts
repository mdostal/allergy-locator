import { describe, expect, it } from "vitest";
import { combineCompositeValues } from "@/lib/severity/combine-profiles";

describe("combineCompositeValues (v3: compare-profiles overlay)", () => {
  it("max takes the single worst value across profiles", () => {
    expect(combineCompositeValues([20, 80, 45], "max")).toBe(80);
  });

  it("max reduces to the single value when only one profile is given", () => {
    expect(combineCompositeValues([60], "max")).toBe(60);
  });

  it("noisy-or reduces to the single value when only one profile is given", () => {
    expect(combineCompositeValues([60], "noisy-or")).toBe(60);
  });

  it("noisy-or never decreases when another nonzero profile is added", () => {
    const one = combineCompositeValues([50], "noisy-or");
    const two = combineCompositeValues([50, 30], "noisy-or");
    expect(two).toBeGreaterThanOrEqual(one);
  });

  it("noisy-or of two 100s saturates at 100, not over", () => {
    expect(combineCompositeValues([100, 100], "noisy-or")).toBe(100);
  });

  it("noisy-or of all zeros stays zero", () => {
    expect(combineCompositeValues([0, 0], "noisy-or")).toBe(0);
  });

  it("noisy-or compounds two moderate values above either alone (matches composite.ts's own math)", () => {
    // 1 - (1-0.5)(1-0.4) = 0.7 -> 70
    expect(combineCompositeValues([50, 40], "noisy-or")).toBe(70);
  });
});
