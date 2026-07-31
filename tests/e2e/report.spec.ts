import { test, expect } from "@playwright/test";

test("Mode 2: generating a report surfaces best time+place, avoid list, and seasonal windows (story s8)", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();

  const generateButton = page.getByRole("button", { name: "Generate report" });
  await expect(generateButton).toBeDisabled();

  await page.getByRole("button", { name: /Load Author's example/ }).click();
  await expect(generateButton).toBeEnabled();
  await generateButton.click();

  await expect(page.getByText("Best time + place")).toBeVisible();
  await expect(page.getByText("Avoid entirely (no good season for you there)")).toBeVisible();
  await expect(page.getByText("Notable seasonal windows")).toBeVisible();
  await expect(page.getByText(/Not medical advice — modeled from open climate/)).toBeVisible();
});

test("Mode 2: the full ranking table covers all 168 cities, not just the top-5 excerpts (explicit user feedback)", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();
  await page.getByRole("button", { name: /Load Author's example/ }).click();
  await page.getByRole("button", { name: "Generate report" }).click();

  const toggle = page.getByRole("button", { name: /Show full ranking \(all 168 cities\)/ });
  await expect(toggle).toBeVisible();
  await toggle.click();

  const table = page.getByRole("table");
  await expect(table).toBeVisible();
  await expect(table.getByRole("row")).toHaveCount(169); // header + 168 cities

  await page.getByRole("button", { name: /Hide full ranking/ }).click();
  await expect(table).not.toBeVisible();
});
