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

test("toggling multiple allergens stacks one overlapping gradient layer per allergen on ONE map", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Grass", { exact: true }).check();
  await page.getByRole("checkbox", { name: /Sagebrush/ }).check();

  // Still exactly one map (per explicit user direction: no small multiples) --
  // but now two overlapping gradient layers, one per active allergen, per
  // explicit user direction: "turning each on should enable another with an
  // opacity and basically overlapping heatmaps."
  await expect(page.getByRole("img", { name: "US allergen severity map" })).toHaveCount(1);
  await expect(page.getByTestId("heatmap-canvas")).toHaveCount(2);
  await expect(page.getByText("Grass severity")).toBeVisible();
  await expect(page.getByText("Sagebrush severity")).toBeVisible();

  // Click El Paso and confirm the detail panel lists both active allergens.
  const elPaso = page.getByRole("button", { name: /El Paso, TX/ }).first();
  await elPaso.click();
  await expect(page.getByText(/^Grass:/).first()).toBeVisible();
  await expect(page.getByText(/^Sagebrush:/).first()).toBeVisible();
});
