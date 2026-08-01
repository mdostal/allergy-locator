import { test, expect } from "@playwright/test";

test("care access map loads, switches layers, and shows city detail on click", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Care access" }).click();
  await expect(page).toHaveURL(/\/care-access/);
  await expect(page.getByRole("heading", { name: "Care access" })).toBeVisible();

  // Default layer is general; switching to pediatric cardiac changes the map.
  await expect(page.getByRole("radio", { name: "General / emergency care" })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.getByRole("radio", { name: "Pediatric cardiac surgery" }).click();
  await expect(page.getByRole("radio", { name: "Pediatric cardiac surgery" })).toHaveAttribute(
    "aria-checked",
    "true",
  );

  // Clicking a city shows its nearest-facility detail for the active layer.
  await page.getByRole("button", { name: /^New York, NY/ }).click();
  await expect(page.getByText("New York, NY", { exact: true })).toBeVisible();
  await expect(page.getByText(/Nearest facility:/)).toBeVisible();
  await expect(page.getByText(/Est. drive time:/)).toBeVisible();
});

test("care access map links back to the allergy map", async ({ page }) => {
  await page.goto("/care-access");
  await page.getByRole("link", { name: "Allergy map" }).click();
  // Note: not asserting the exact URL here -- MapView's own URL write-back
  // effect appends its compact `?s=` state param right after hydration, so
  // asserting a bare "/" is a real race (passed locally, failed in CI).
  await expect(page.getByRole("heading", { name: "Allergy Locator" })).toBeVisible();
  expect(new URL(page.url()).pathname).toBe("/");
});
