import { test, expect } from "@playwright/test";
import path from "node:path";

test("uploading two panels shows a history trend chart; one upload alone does not", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();

  await expect(page.getByText("Your allergies over time")).not.toBeVisible();

  // First upload -- still only one data point, no trend to show yet.
  await page
    .getByLabel("Upload allergy test file")
    .setInputFiles(path.join(__dirname, "fixtures", "sample-panel.csv"));
  await page.getByRole("button", { name: /Apply \d+ matched allergens? to your profile/ }).click();
  await expect(page.getByText("Your allergies over time")).not.toBeVisible();

  // Second upload -- now there's a real trend across 2 snapshots.
  await page
    .getByLabel("Upload allergy test file")
    .setInputFiles(path.join(__dirname, "fixtures", "sample-panel-2.csv"));
  await page.getByRole("button", { name: /Apply \d+ matched allergens? to your profile/ }).click();

  await expect(page.getByText("Your allergies over time")).toBeVisible();
  await expect(page.getByText("From your 2 uploaded tests.")).toBeVisible();
  await expect(page.getByRole("img", { name: /Your allergy sensitivities over time/ })).toBeVisible();

  // Grass moved between uploads (class 4 -> class 2); ragweed appears in the
  // 2nd upload only -- both should show up as tracked lines in the chart's
  // own legend specifically (scoped past this heading + its tab row up to
  // the whole card, to avoid colliding with the identically-labeled
  // sensitivity sliders elsewhere on the page).
  const chartSection = page.locator("h3", { hasText: "Your allergies over time" }).locator("../..");
  // Scoped to <span> legend entries specifically, not the SVG <title> hover
  // tooltips (which repeat each allergen's name once per data point).
  await expect(chartSection.locator("span", { hasText: "Grass" }).first()).toBeVisible();
  await expect(chartSection.locator("span", { hasText: "Common ragweed" }).first()).toBeVisible();
});

test("a Full history tab shows every recorded allergen as a plain table, distinguishing untested from a real 0", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();

  // First upload only ever tested grass -- ragweed is genuinely absent, not
  // recorded at 0.
  await page
    .getByLabel("Upload allergy test file")
    .setInputFiles(path.join(__dirname, "fixtures", "sample-panel-grass-only.csv"));
  await page.getByRole("button", { name: /Apply \d+ matched allergens? to your profile/ }).click();
  // Second upload adds ragweed for the first time.
  await page
    .getByLabel("Upload allergy test file")
    .setInputFiles(path.join(__dirname, "fixtures", "sample-panel-2.csv"));
  await page.getByRole("button", { name: /Apply \d+ matched allergens? to your profile/ }).click();

  const chartSection = page.locator("h3", { hasText: "Your allergies over time" }).locator("../..");
  await chartSection.getByRole("tab", { name: "Full history" }).click();

  const table = chartSection.locator("table");
  await expect(table).toBeVisible();
  await expect(table.locator("th", { hasText: "Grass" })).toBeVisible();
  await expect(table.locator("th", { hasText: "Common ragweed" })).toBeVisible();
  // Row 1 (grass-only upload): ragweed wasn't tested that time -- a blank
  // dash, not a false 0.
  await expect(table.locator("tbody tr").first().locator("td").last()).toHaveText("—");
  // Row 2 (both tested): a real recorded value, not a dash.
  await expect(table.locator("tbody tr").last().locator("td").last()).toHaveText("45");
});
