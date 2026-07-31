import { test, expect } from "@playwright/test";

test("toggling grass colors the map and shows city detail on click", async ({ page }) => {
  await page.goto("/");

  const grassToggle = page.getByLabel("Grass");
  await expect(grassToggle).toBeVisible();
  await grassToggle.check();

  // Austin, TX is the "worst" tier for grass per the validated ground-truth data.
  const austin = page.getByRole("button", { name: /Austin, TX/ });
  await expect(austin).toBeVisible();
  await austin.click();

  await expect(page.getByRole("heading", { name: "Austin, TX" })).toBeVisible();
  await expect(page.getByText(/worst \(91\/100\)/i)).toBeVisible();
});
