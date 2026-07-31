import { test, expect } from "@playwright/test";

/**
 * Story s11: grass is the ONE allergen with an actual ground-truth fit
 * (data/allergy-scoring.md, MAE 2.3), and docs/story/MY-ANSWER.md documents
 * real lived-experience tiers for these exact cities. This suite proves
 * story s6's season engine doesn't quietly break that fit -- at each city's
 * own real grass-peak month, the season-adjusted score reproduces the
 * documented annual tier exactly; at genuinely different timeframe positions
 * (not just "now"/annual), not one fixed month.
 */
test("grass ground-truth tiers hold at each city's own peak month, across 3+ distinct timeframe positions", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Grass", { exact: true }).check();

  const cases: Array<[string, string, string]> = [
    // [city button name, month value, documented tier text from MY-ANSWER.md]
    ["Salt Lake City, UT", "6", "moderate"], // BSk zone, June peak -- "dry reputation, but an irrigated valley -- turf trap"
    ["Flagstaff, AZ", "7", "near-zero"], // Dsb zone, July peak -- "felt great. High dry pine. (validated)"
    ["Carlsbad, NM", "6", "high"], // BWk zone, June peak -- "grass-light but miserable -- desert weed + dust (validated)"
  ];

  for (const [cityName, month, tier] of cases) {
    await page.getByLabel("Timeframe").selectOption(month);
    const marker = page.getByRole("button", { name: new RegExp(cityName.replace(",", ",?")) }).first();
    await marker.click({ force: true });
    await expect(page.getByRole("heading", { name: cityName })).toBeVisible();
    await expect(page.getByText(new RegExp(`^Grass: ${tier} \\(`))).toBeVisible();
  }

  // A genuinely different (off-season) timeframe position, distinct from the
  // three peak months above -- still matches its documented near-zero tier,
  // since Flagstaff's air stays clean year-round, not just at its peak.
  await page.getByLabel("Timeframe").selectOption("1");
  const flagstaff = page.getByRole("button", { name: /Flagstaff, AZ/ }).first();
  await flagstaff.click({ force: true });
  await expect(page.getByText(/^Grass: near-zero \(/)).toBeVisible();
});
