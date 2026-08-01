import { test, expect } from "@playwright/test";
import path from "node:path";

const FIXTURE_PATH = path.join(__dirname, "fixtures", "sample-panel.csv");

test("uploading a CSV panel auto-matches allergens, lets the user fix the gap, and applies to the profile", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();

  await expect(page.getByText("Upload your allergy test")).toBeVisible();

  const fileInput = page.getByLabel("Upload allergy test file");
  await fileInput.setInputFiles(FIXTURE_PATH);

  await expect(page.getByText(/2 of 3 rows matched automatically/)).toBeVisible();

  // The unmatched "Dust Mite" row (a real gap -- not modeled by this app)
  // starts with an empty "Not matched" dropdown instead of being silently
  // dropped; the user picks a real match themselves.
  const dustMiteRow = page.locator("tr", { hasText: "Dust Mite" });
  await expect(dustMiteRow.getByLabel(/Match for Dust Mite/)).toHaveValue("");
  await dustMiteRow.getByLabel(/Match for Dust Mite/).selectOption("mugwort");

  await page.getByRole("button", { name: /Apply 3 matched allergens to your profile/ }).click();

  // Applied to the actual sensitivity sliders below -- Bermuda Grass class 4
  // -> grass=60, and the manually-fixed Dust Mite (class 2) -> mugwort=30.
  await expect(page.locator("#sensitivity-grass")).toHaveValue("60");
  await expect(page.locator("#sensitivity-mugwort")).toHaveValue("30");
});
