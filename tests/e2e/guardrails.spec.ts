import { test, expect } from "@playwright/test";

test("zero network requests leave the origin on the core map path (open-source guardrail)", async ({
  page,
}) => {
  const externalRequests: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.origin !== "http://localhost:3000") {
      externalRequests.push(request.url());
    }
  });

  await page.goto("/");
  await page.getByLabel("Grass", { exact: true }).check();
  await page.getByRole("button", { name: /Austin, TX/ }).first().click();
  await page.getByRole("radio", { name: "My map" }).click();
  await page.getByRole("button", { name: /Load Author's example/ }).click();
  await page.getByRole("button", { name: "Generate report" }).click();

  expect(externalRequests).toEqual([]);
});

test("every non-grass category produces a plausible, non-crashing result when toggled (open-source guardrail: no ground-truth claim beyond grass)", async ({
  page,
}) => {
  await page.goto("/");

  // One representative per category (weed, tree, mold) -- deliberately not
  // every one of the ~27 non-grass allergens, per this story's own mitigation
  // against combinatorial CI cost. Comprehensive presence (all categories
  // visible) is already covered by mode1-grass.spec.ts.
  for (const label of [/Sagebrush/, /Red oak/, /Cladosporium/]) {
    await page.getByRole("checkbox", { name: label }).check();
    const austin = page.getByRole("button", { name: /Austin, TX/ }).first();
    await austin.click({ force: true });
    // A valid, in-range severity renders -- never a crash, never a raw NaN/undefined.
    await expect(page.getByText(/modeled, not ground-truth-validated/).first()).toBeVisible();
    await expect(page.getByText(/\(\d{1,3}\/100\)/).first()).toBeVisible();
    await page.getByRole("checkbox", { name: label }).uncheck();
  }
});
