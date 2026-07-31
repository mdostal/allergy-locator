import { defineConfig } from "vitest/config";
import path from "node:path";

// Note: not using @vitejs/plugin-react here. This machine's pnpm install is
// missing rolldown's platform-native optional binding (a known-broken pnpm
// global store on this box — see task "Fix duplicate pnpm installs /
// store-version mismatch", unrelated to this project). Vite/vitest's default
// esbuild transform already handles JSX/TSX fine for tests without the plugin.
export default defineConfig({
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@data": path.resolve(__dirname, "./data"),
    },
  },
});
