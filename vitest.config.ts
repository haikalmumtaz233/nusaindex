import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const librarySource = fileURLToPath(new URL("packages/nusaindex/src/", import.meta.url));

export default defineConfig({
  resolve: {
    alias: [{ find: /^nusaindex\/(.+)$/, replacement: `${librarySource}$1/index.ts` }],
  },
  test: {
    include: ["packages/*/test/**/*.test.ts", "site/test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["packages/*/src/**/*.ts"],
      exclude: [
        "packages/*/src/index.ts",
        "packages/*/src/cli/main.ts",
        "packages/mcp/src/main.ts",
        "packages/*/src/generated/**",
      ],
      reporter: ["text-summary"],
      thresholds: {
        perFile: true,
        statements: 95,
        branches: 95,
        functions: 95,
        lines: 95,
      },
    },
  },
});
