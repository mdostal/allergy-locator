import { test, expect } from "@playwright/test";

test("a continuous gradient renders for exactly one active allergen, with a legend", async ({
  page,
}) => {
  await page.goto("/");

  // Nothing active yet -- no heatmap, no legend.
  await expect(page.getByTestId("heatmap-canvas")).toHaveCount(0);

  await page.getByLabel("Grass", { exact: true }).check();
  await expect(page.getByTestId("heatmap-canvas")).toHaveCount(1);
  await expect(page.getByText("Grass severity")).toBeVisible();

  // 2+ active allergens: back to the concentric-ring case, no continuous surface
  // (blending multiple fields into one gradient is a deliberate non-goal here).
  await page.getByRole("checkbox", { name: /Sagebrush/ }).check();
  await expect(page.getByTestId("heatmap-canvas")).toHaveCount(0);
  await expect(page.getByText("Grass severity")).not.toBeVisible();
});

test("Mode 2 always renders a continuous composite gradient with a legend", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();

  await expect(page.getByTestId("heatmap-canvas")).toHaveCount(1);
  await expect(page.getByText("Your composite score")).toBeVisible();
});
