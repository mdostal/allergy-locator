import { describe, expect, it } from "vitest";
import { generateReport } from "@/lib/reports/generate";
import authorPreset from "@data/presets/author.json";

describe("report generation (story s8)", () => {
  it("returns null when no allergen has a nonzero sensitivity", () => {
    expect(generateReport({})).toBeNull();
    expect(generateReport({ grass: 0 })).toBeNull();
  });

  it("sweeps the full 168-city x 12-month matrix in reasonable time", () => {
    const start = performance.now();
    const report = generateReport(authorPreset.sensitivities);
    const elapsed = performance.now() - start;
    expect(report).not.toBeNull();
    expect(elapsed).toBeLessThan(1000);
  });

  it("author's example: best time+place is a plausible high-dry-West/cold-North city, not a hardcoded pick", () => {
    const report = generateReport(authorPreset.sensitivities);
    expect(report).not.toBeNull();
    // Per docs/story/MY-ANSWER.md, the author's easiest air is the high-dry
    // interior West / cold-reset North -- never a humid, year-round-grass
    // Southeast or Gulf/Florida city.
    const worstStates = new Set(["FL", "LA", "TX", "GA", "AL", "MS", "SC", "HI"]);
    expect(worstStates.has(report!.bestTimePlace.state)).toBe(false);
    expect(report!.bestTimePlace.value).toBeLessThan(30);
  });

  it("ties at the winter floor break toward the city with the best year-round average, not iteration order", () => {
    // Regression guard: many climate zones' winter multiplier rounds several
    // dozen cities down to a literal 0 in the same month, so naive "first
    // minimum wins" picked an arbitrary Midwest city (Chicago) that is a poor
    // year-round match, instead of the high-dry-West/cold-North cities
    // MY-ANSWER.md actually documents as the author's best air.
    const report = generateReport(authorPreset.sensitivities);
    expect(report).not.toBeNull();
    expect(["Anchorage", "Flagstaff", "Rapid City", "Billings", "Santa Fe", "Sundance"]).toContain(
      report!.bestTimePlace.city,
    );
  });

  it("author's example: the avoid-entirely list is dominated by humid, no-reset climates", () => {
    const report = generateReport(authorPreset.sensitivities);
    expect(report).not.toBeNull();
    // Per MY-ANSWER.md, subtropical Florida ("grass year-round, no reset") is
    // the author's worst documented case.
    const avoidStates = report!.worstAvoid.map((c) => c.state);
    expect(avoidStates).toContain("FL");
  });

  it("seasonal windows are labeled with real month ranges, not raw month numbers", () => {
    const report = generateReport(authorPreset.sensitivities);
    expect(report).not.toBeNull();
    for (const window of report!.seasonalWindows) {
      if (window.lowWindow) expect(window.lowWindow).toMatch(/[A-Za-z]{3}/);
      if (window.highWindow) expect(window.highWindow).toMatch(/[A-Za-z]{3}/);
    }
  });
});
