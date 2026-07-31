import { test, expect } from "@playwright/test";

test("home page loads with the disclaimer footer", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Allergy Locator")).toBeVisible();
  await expect(page.getByText(/not medical advice/i)).toBeVisible();
});
