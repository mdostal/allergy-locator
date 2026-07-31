import { test, expect } from "@playwright/test";

test("Mode 2: loading the author's example produces a personalized composite map", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("radio", { name: "My map" }).click();
  await expect(
    page.getByRole("button", { name: /Load Author's example/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Load Author's example/i }).click();

  // Grass slider should now reflect the loaded preset value.
  const grassSlider = page.locator('input[type="range"]').first();
  await expect(grassSlider).toHaveValue("85");

  const austin = page.getByRole("button", { name: /Austin, TX/ }).first();
  await austin.click();
  await expect(page.getByText(/Your score:/)).toBeVisible();
});

test("Mode 2 shows a neutral prompt until a sensitivity is set", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();
  const austin = page.getByRole("button", { name: /Austin, TX/ }).first();
  await austin.click();
  await expect(page.getByText(/Set at least one sensitivity slider/i)).toBeVisible();
});
