import { test, expect } from "@playwright/test";

test("about page shows both tabs and switches between ABOUT copy variants", async ({ page }) => {
  await page.goto("/about");

  await expect(page.getByRole("heading", { name: "About Allergy Locator" })).toBeVisible();

  await page.getByRole("button", { name: "My Story" }).click();
  await expect(page.getByRole("heading", { name: /Why this exists/i })).toBeVisible();

  await page.getByRole("button", { name: "The Project" }).click();
  await expect(page.getByRole("heading", { name: "About Allergy Locator" })).toBeVisible();

  await page.getByRole("radio", { name: "Copy variant 2" }).click();
  await expect(page.getByRole("heading", { name: "About Allergy Locator — draft 2" })).toBeVisible();
});

test("about page layout toggle switches between layout A and B", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("button", { name: "B", exact: true }).click();
  await expect(page.getByRole("navigation", { name: "About sections" })).toBeVisible();
});
