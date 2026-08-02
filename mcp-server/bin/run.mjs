#!/usr/bin/env node
// Thin launcher so `npx @allergy-locator/mcp-server` (or a direct `bin` invocation
// from Claude Desktop/Code's MCP config) runs the real TypeScript source via tsx,
// without a separate compiled dist/ step -- this server exists to be run directly
// off the same source tree that imports allergy-locator's real lib code (see
// src/index.ts's own doc comment), so keeping it source-only avoids a build step
// that could silently drift from the app it's wrapping.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const here = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(here, "..", "src", "index.ts");

const child = spawn("npx", ["--yes", "tsx", entry], {
  stdio: "inherit",
  cwd: path.join(here, ".."),
});

child.on("exit", (code) => process.exit(code ?? 0));
