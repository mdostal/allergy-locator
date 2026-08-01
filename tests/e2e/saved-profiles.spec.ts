import { test, expect } from "@playwright/test";

test("saving, loading, and deleting a named profile (v3 kickoff)", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();

  await expect(page.getByText("No saved profiles yet")).toBeVisible();

  // Set a sensitivity, then save it as a named profile.
  const grassSlider = page.locator("#sensitivity-grass");
  await grassSlider.fill("70");
  await page.getByLabel("New profile name").fill("Me");
  await page.getByRole("button", { name: "Save current" }).click();

  await expect(page.getByText("No saved profiles yet")).not.toBeVisible();
  const savedRow = page.getByText("Me", { exact: true });
  await expect(savedRow).toBeVisible();

  // Change the slider, then load the saved profile back -- it should replace
  // the current value, not merge with it.
  await grassSlider.fill("10");
  await page.getByRole("button", { name: "Load", exact: true }).click();
  await expect(grassSlider).toHaveValue("70");

  // Delete it -- back to the empty state.
  await page.getByRole("button", { name: "Delete profile Me" }).click();
  await expect(page.getByText("No saved profiles yet")).toBeVisible();
});

test("saved profiles persist across a reload (real localStorage, not in-memory only)", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();
  await page.locator("#sensitivity-grass").fill("55");
  await page.getByLabel("New profile name").fill("Partner");
  await page.getByRole("button", { name: "Save current" }).click();

  await page.reload();
  await page.getByRole("radio", { name: "My map" }).click();
  await expect(page.getByText("Partner", { exact: true })).toBeVisible();
});
