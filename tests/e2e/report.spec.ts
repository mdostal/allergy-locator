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
