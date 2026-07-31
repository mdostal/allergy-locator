import { test, expect } from "@playwright/test";

test("year playback advances the month automatically and pauses on demand (story s7)", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Grass", { exact: true }).check();

  const timeframe = page.getByLabel("Timeframe");
  await expect(timeframe).toHaveValue("annual");

  await page.getByRole("button", { name: "Play the year" }).click();

  await expect(async () => {
    const value = await timeframe.inputValue();
    expect(value).not.toBe("annual");
  }).toPass({ timeout: 3000 });

  await page.getByRole("button", { name: "Pause year playback" }).click();
  const pausedValue = await timeframe.inputValue();
  await page.waitForTimeout(1200);
  await expect(timeframe).toHaveValue(pausedValue);
});
