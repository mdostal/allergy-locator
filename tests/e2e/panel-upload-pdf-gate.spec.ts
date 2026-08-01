import { test, expect } from "@playwright/test";
import path from "node:path";

/**
 * Tests the gating behavior around PDF/photo upload, NOT the actual Claude
 * extraction -- that needs a real API key and a real network call, which
 * this suite never makes (see lib/panel-import/claude-client.ts's own
 * docstring; unit tests mock fetch instead). This confirms the UI correctly
 * blocks with a helpful message when no key is saved, and proceeds to call
 * out to the network (proving it tried) once a key IS saved.
 */

const PDF_FIXTURE = path.join(__dirname, "fixtures", "fake.pdf");

test("uploading a PDF with no saved API key is blocked with a helpful message, no network call", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => requests.push(r.url()));

  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();

  const fileInput = page.getByLabel("Upload allergy test file");
  await fileInput.setInputFiles(PDF_FIXTURE);

  await expect(page.getByText(/needs your own Anthropic API key/)).toBeVisible();

  const external = requests.filter((u) => !u.startsWith("http://localhost:3000"));
  expect(external).toEqual([]);
});

test("uploading a PDF with a saved key attempts a real extraction call", async ({ page }) => {
  await page.goto("/about");
  await page.getByRole("button", { name: "Methodology" }).click();
  await page.getByLabel("Anthropic API key").fill("sk-ant-fake-test-key-for-e2e-gating-only");
  await page.getByRole("button", { name: "Save key" }).click();
  await expect(page.getByText(/Key saved/)).toBeVisible();

  await page.goto("/");
  await page.getByRole("radio", { name: "My map" }).click();

  // Intercept the real Anthropic endpoint so this test never depends on (or
  // pays for) an actual API call -- it only proves the app tried to make one
  // once a key is present, which is the behavior this test is scoped to.
  await page.route("https://api.anthropic.com/v1/messages", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: [
          { type: "tool_use", name: "record_allergy_panel", input: { rows: [{ name: "Bermuda Grass", value: 4 }] } },
        ],
      }),
    }),
  );

  const fileInput = page.getByLabel("Upload allergy test file");
  await fileInput.setInputFiles(PDF_FIXTURE);

  await expect(page.getByText(/rows matched automatically \(verified against the original\)/)).toBeVisible();
  await expect(page.locator("tr", { hasText: "Bermuda Grass" })).toBeVisible();
});
