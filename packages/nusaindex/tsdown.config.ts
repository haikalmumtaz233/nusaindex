import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    index: "src/index.ts",
    nik: "src/nik/index.ts",
    normalize: "src/normalize/index.ts",
    npwp: "src/npwp/index.ts",
    phone: "src/phone/index.ts",
    plate: "src/plate/index.ts",
  },
  format: "esm",
  platform: "neutral",
  target: "es2022",
  dts: true,
  clean: true,
  fixedExtension: false,
});
