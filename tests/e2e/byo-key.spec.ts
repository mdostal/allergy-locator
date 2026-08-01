import { test, expect } from "@playwright/test";

test("BYO-key settings save, persist, validate, and clear -- no network call involved", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));

  await page.goto("/about");
  await page.getByRole("button", { name: "Methodology" }).click();

  await expect(page.getByText("Your API key (coming soon)")).toBeVisible();

  const input = page.getByLabel("Anthropic API key");
  const saveButton = page.getByRole("button", { name: "Save key" });

  // Rejects an obviously-wrong shape.
  await input.fill("not-a-real-key");
  await saveButton.click();
  await expect(page.getByText(/doesn't look like an Anthropic API key/)).toBeVisible();

  // Accepts and persists a plausible one.
  await input.fill("sk-ant-abc123abc123abc123abc123");
  await saveButton.click();
  await expect(page.getByText(/Key saved: sk-ant-abc1/)).toBeVisible();

  await page.reload();
  await page.getByRole("button", { name: "Methodology" }).click();
  await expect(page.getByText(/Key saved: sk-ant-abc1/)).toBeVisible();

  await page.getByRole("button", { name: "Remove key" }).click();
  await expect(page.getByLabel("Anthropic API key")).toBeVisible();

  // Never touches the network -- this slice is storage-only, no LLM call yet.
  const external = requests.filter((u) => !u.startsWith("http://localhost:3000"));
  expect(external).toEqual([]);
});
