import { test, expect } from "@playwright/test";

test("switching the timeframe re-scores the map by season (story s6)", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Grass", { exact: true }).check();

  const austin = page.getByRole("button", { name: /Austin, TX/ }).first();
  await austin.click();

  // Default is annual/peak-season -- matches the unmodified ground-truth score.
  await expect(page.getByText(/worst \(91\/100\)/i)).toBeVisible();

  // Austin (warm-temperate) has almost no grass pollen in January -- real
  // per-city NOAA daily-normal data drives this now (data/daily-season-
  // curves.json), not a shared 4-zone-group curve, so the exact value is a
  // real climate-derived number rather than one fixed digit.
  await page.getByLabel("Timeframe").selectOption("1");
  await expect(page.getByText(/near-zero \(\d{1,2}\/100\)/i)).toBeVisible();

  // Switching back to July (Austin's grass peak) returns to the same score.
  await page.getByLabel("Timeframe").selectOption("7");
  await expect(page.getByText(/worst \(91\/100\)/i)).toBeVisible();
});
