import { test, expect } from "@playwright/test";

test("toggling grass colors the map and shows city detail on click", async ({ page }) => {
  await page.goto("/");

  const grassToggle = page.getByLabel("Grass", { exact: true });
  await expect(grassToggle).toBeVisible();
  await grassToggle.check();

  // Austin, TX is the "worst" tier for grass per the validated ground-truth data.
  const austin = page.getByRole("button", { name: /Austin, TX/ }).first();
  await expect(austin).toBeVisible();
  await austin.click();

  await expect(page.getByRole("heading", { name: "Austin, TX" })).toBeVisible();
  await expect(page.getByText(/worst \(91\/100\)/i)).toBeVisible();
});

test("comprehensive allergen categories are visible (story s3/s4)", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Grasses", { exact: true })).toBeVisible();
  await expect(page.getByText("Weeds", { exact: true })).toBeVisible();
  await expect(page.getByText("Trees", { exact: true })).toBeVisible();
  await expect(page.getByText("Mold", { exact: true })).toBeVisible();
  await expect(page.getByLabel(/Sagebrush/)).toBeVisible();
  await expect(page.getByLabel(/Cladosporium/)).toBeVisible();
});

test("toggling multiple allergens keeps everything on ONE map (concentric rings, not separate maps)", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Grass", { exact: true }).check();
  await page.getByLabel(/Sagebrush/).check();

  // Still exactly one map (per explicit user direction: no small multiples).
  await expect(page.getByRole("img", { name: "US allergen severity map" })).toHaveCount(1);

  // Click El Paso (arid, geographically isolated in this 168-city spine -- avoids
  // the dense Phoenix-metro cluster where adjacent cities' overlapping circles can
  // intercept clicks, a real rendering concern tracked separately) and confirm the
  // detail panel lists both active allergens for it.
  // The concentric rings share one center point by design, so Playwright's
  // overlap check flags them even though the shared onClick (on the wrapping <g>)
  // selects the same city regardless of which ring's circle receives the click.
  const elPaso = page.getByRole("button", { name: /El Paso, TX/ }).first();
  await elPaso.click({ force: true });
  await expect(page.getByText(/^Grass:/).first()).toBeVisible();
  await expect(page.getByText(/^Sagebrush:/).first()).toBeVisible();
});
