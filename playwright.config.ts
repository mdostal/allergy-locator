import { defineConfig } from "@playwright/test";

// The production app is mounted at basePath "/allergy-locator"
// (next.config.ts), but every existing spec navigates with a LEADING slash
// (page.goto("/...")), which per the WHATWG URL spec resolves against the
// origin only and discards a baseURL's own path segment -- so the E2E
// server runs with basePath disabled (E2E_NO_BASE_PATH) instead of rewriting
// ~41 call sites across the suite for a mechanical Next.js config detail.
// basePath's own mechanics were verified separately -- see next.config.ts.
export default defineConfig({
  testDir: "./tests/e2e",
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: { E2E_NO_BASE_PATH: "1" },
  },
  use: {
    baseURL: "http://localhost:3000",
  },
});
