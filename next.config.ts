import type { NextConfig } from "next";

/**
 * Mounted at tools.mdostal.com/allergy-locator via a multi-zone rewrite in
 * the mdostal-tools-hub repo (see that repo's README for the pattern).
 * basePath makes every internal link, redirect, and /_next/* asset request
 * this app emits already carry the /allergy-locator prefix, so the hub's
 * rewrite (which forwards that same prefixed path straight through) just
 * works -- no separate asset-rewrite rule needed. This is Vercel's own
 * documented mechanism for this exact multi-zone setup.
 *
 * E2E_NO_BASE_PATH (set only by playwright.config.ts's webServer) disables
 * basePath for the local E2E test server specifically. Every existing E2E
 * spec navigates with a LEADING slash (page.goto("/..")), which per the
 * WHATWG URL spec resolves against the origin only and discards baseURL's
 * own path segment -- so a basePath'd server would 404 on every one of
 * those calls, not because the app is broken but because of how leading-
 * slash relative URLs resolve, not this app's own behavior. Rewriting all
 * ~41 call sites across the suite to drop the leading slash was rejected
 * as needless churn for a mechanical Next.js feature Next.js itself is
 * responsible for implementing correctly. basePath's actual mechanics
 * (root 404s, /allergy-locator/* 200s, /_next/* assets resolve under the
 * prefix) were verified manually via a real `pnpm build && pnpm start` +
 * curl pass -- see the PR description for the exact commands/output.
 */
const nextConfig: NextConfig = {
  basePath: process.env.E2E_NO_BASE_PATH ? undefined : "/allergy-locator",
};

export default nextConfig;
