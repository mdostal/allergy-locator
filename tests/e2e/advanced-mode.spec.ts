import { test, expect } from "@playwright/test";

test("Advanced mode reveals live model parameters and recomputes the map when changed", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();
  await page.getByRole("button", { name: /Load Author's example/ }).click();

  // Hidden by default.
  await expect(page.getByText("Advanced: live model parameters")).not.toBeVisible();

  await page.getByRole("button", { name: /Show advanced/ }).click();
  await expect(page.getByText("Advanced: live model parameters")).toBeVisible();

  // Switching combination method genuinely recomputes StateDetailPanel's
  // displayed composite score for the selected city, not just a label.
  const austin = page.getByRole("button", { name: /Austin, TX/ }).first();
  await austin.click();
  const scoreText = page.getByText(/^Your score: \d+\/100$/);
  await expect(scoreText).toBeVisible();
  const noisyOrScore = await scoreText.textContent();

  await page.getByRole("radio", { name: /Sensitivity-weighted average/ }).check();
  await expect(scoreText).not.toHaveText(noisyOrScore!);

  await page.getByRole("button", { name: "Reset" }).click();
  await expect(page.getByRole("radio", { name: /Noisy-OR/ })).toBeChecked();
  await expect(scoreText).toHaveText(noisyOrScore!);
});
