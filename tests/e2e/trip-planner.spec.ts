import { test, expect } from "@playwright/test";

test("Trip planner forecasts a real day-by-day range for a chosen destination and dates", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();
  await page.getByRole("button", { name: /Load Author's example/ }).click();

  await expect(page.getByText("Set a nonzero sensitivity above to forecast a trip.")).not.toBeVisible();
  await expect(page.getByText("Pick a departure and return date.")).toBeVisible();

  await page.getByLabel("Destination").selectOption("austin-tx");
  await page.getByLabel("Departure").fill("2026-07-10");
  await page.getByLabel("Return").fill("2026-07-14");

  await expect(page.getByText(/Austin, TX: average score/)).toBeVisible();
  await expect(page.getByText(/Best day:.*Worst day:/)).toBeVisible();
  // 5-day trip (Jul 10-14 inclusive) -> 5 rows in the day-by-day table.
  const rows = page.locator("table tbody tr");
  await expect(rows).toHaveCount(5);
});

test("Trip planner shows a neutral prompt with no sensitivities set", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();
  await expect(page.getByText("Set a nonzero sensitivity above to forecast a trip.")).toBeVisible();
});
