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

test("toggling multiple allergens renders small multiples, not one blended map", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Grass", { exact: true }).check();
  await page.getByLabel(/Sagebrush/).check();

  // Two distinct labeled mini-maps should now be visible.
  await expect(page.getByRole("img", { name: "Grass severity map" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Sagebrush.*severity map/ })).toBeVisible();
});
