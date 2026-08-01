import { test, expect } from "@playwright/test";

test("a continuous gradient renders per active allergen, stacking as more are toggled on", async ({
  page,
}) => {
  await page.goto("/");

  // Nothing active yet -- no heatmap, no legend.
  await expect(page.getByTestId("heatmap-canvas")).toHaveCount(0);

  await page.getByLabel("Grass", { exact: true }).check();
  await expect(page.getByTestId("heatmap-canvas")).toHaveCount(1);
  await expect(page.getByText("Grass severity")).toBeVisible();

  // A 2nd active allergen stacks its OWN overlapping gradient layer rather
  // than replacing the first, per explicit user direction: "turning each on
  // should enable another with an opacity and basically overlapping heatmaps."
  await page.getByRole("checkbox", { name: /Sagebrush/ }).check();
  await expect(page.getByTestId("heatmap-canvas")).toHaveCount(2);
  await expect(page.getByText("Grass severity")).toBeVisible();
  await expect(page.getByText("Sagebrush severity")).toBeVisible();

  // Unchecking one drops back to a single, fully-opaque layer.
  await page.getByLabel("Grass", { exact: true }).uncheck();
  await expect(page.getByTestId("heatmap-canvas")).toHaveCount(1);
  await expect(page.getByText("Grass severity")).not.toBeVisible();
  await expect(page.getByText("Sagebrush severity")).toBeVisible();
});

test("Mode 2 always renders a continuous composite gradient with a legend", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();

  await expect(page.getByTestId("heatmap-canvas")).toHaveCount(1);
  await expect(page.getByText("Your composite score")).toBeVisible();
});
