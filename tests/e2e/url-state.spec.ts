import { test, expect } from "@playwright/test";

test("full map configuration round-trips through the URL (story s9)", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Grass", { exact: true }).check();
  await page.getByRole("checkbox", { name: /Sagebrush/ }).check();
  await page.getByLabel("Timeframe").selectOption("7");

  await expect(page).toHaveURL(/\?s=/);
  const url = page.url();

  // Reopen the exact URL in a fresh navigation -- the same view must render.
  await page.goto(url);
  await expect(page.getByLabel("Grass", { exact: true })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: /Sagebrush/ })).toBeChecked();
  await expect(page.getByLabel("Timeframe")).toHaveValue("7");
});

test("a URL with no state params falls back to defaults without crashing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("radio", { name: "Allergen overlays" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.getByLabel("Timeframe")).toHaveValue("annual");
});

test("a malformed state param falls back gracefully instead of crashing", async ({ page }) => {
  await page.goto("/?s=%%%not-valid%%%");
  await expect(page.getByRole("heading", { name: "Allergy Locator" })).toBeVisible();
  await expect(page.getByRole("radio", { name: "Allergen overlays" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
});
