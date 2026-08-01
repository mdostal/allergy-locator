import { test, expect } from "@playwright/test";

async function saveProfile(page: import("@playwright/test").Page, name: string, grassValue: string) {
  await page.locator("#sensitivity-grass").fill(grassValue);
  await page.getByLabel("New profile name").fill(name);
  await page.getByRole("button", { name: "Save current" }).click();
}

test("comparing 2+ saved profiles offers switchable worst-case / noisy-OR / side-by-side views", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();

  await expect(page.getByText("Save at least 2 profiles")).toBeVisible();

  await saveProfile(page, "Alex", "80");
  await saveProfile(page, "Sam", "30");

  // Select both for comparison -- the tab strip should appear.
  await page.getByLabel("Alex", { exact: true }).check();
  await page.getByLabel("Sam", { exact: true }).check();
  const tabs = page.getByRole("tablist", { name: "Compare view" });
  await expect(tabs).toBeVisible();

  // Default view (worst-case) renders one blended map.
  await expect(page.getByRole("img", { name: /Combined allergy severity/ })).toBeVisible();

  // Noisy-OR view still renders one blended map, distinctly labeled.
  await page.getByRole("tab", { name: "Noisy-OR" }).click();
  await expect(page.getByRole("img", { name: /noisy-OR/ })).toBeVisible();

  // Side-by-side renders two independent, unblended maps instead.
  await page.getByRole("tab", { name: "Side-by-side" }).click();
  await expect(page.getByText("Alex", { exact: true }).last()).toBeVisible();
  await expect(page.getByText("Sam", { exact: true }).last()).toBeVisible();
  await expect(page.getByRole("img", { name: "Your personalized allergy severity map" })).toHaveCount(2);
});

test("side-by-side is disabled once a 3rd profile is selected", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();

  await saveProfile(page, "Alex", "80");
  await saveProfile(page, "Sam", "30");
  await saveProfile(page, "Jo", "50");

  await page.getByLabel("Alex", { exact: true }).check();
  await page.getByLabel("Sam", { exact: true }).check();
  await page.getByLabel("Jo", { exact: true }).check();

  await expect(page.getByRole("tab", { name: "Side-by-side" })).toBeDisabled();
});
