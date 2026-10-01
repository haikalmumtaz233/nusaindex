import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { main: "src/main.ts" },
  format: "esm",
  platform: "node",
  target: "node22",
  dts: false,
  clean: true,
  fixedExtension: false,
  noExternal: ["@modelcontextprotocol/server", "@modelcontextprotocol/core", "zod"],
});
