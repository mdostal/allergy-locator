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
  // own legend specifically (scoped past this heading to avoid colliding
  // with the identically-labeled sensitivity sliders elsewhere on the page).
  const chartSection = page.locator("h3", { hasText: "Your allergies over time" }).locator("..");
  // Scoped to <span> legend entries specifically, not the SVG <title> hover
  // tooltips (which repeat each allergen's name once per data point).
  await expect(chartSection.locator("span", { hasText: "Grass" }).first()).toBeVisible();
  await expect(chartSection.locator("span", { hasText: "Common ragweed" }).first()).toBeVisible();
});
