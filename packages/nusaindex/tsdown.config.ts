import { defineConfig } from "tsdown";

export default defineConfig({
  entry: {
    bank: "src/bank/index.ts",
    holiday: "src/holiday/index.ts",
    index: "src/index.ts",
    nik: "src/nik/index.ts",
    nip: "src/nip/index.ts",
    nisn: "src/nisn/index.ts",
    normalize: "src/normalize/index.ts",
    npwp: "src/npwp/index.ts",
    phone: "src/phone/index.ts",
    plate: "src/plate/index.ts",
    region: "src/region/index.ts",
    rupiah: "src/rupiah/index.ts",
    workday: "src/workday/index.ts",
  },
  format: "esm",
  platform: "neutral",
  target: "es2022",
  dts: true,
  clean: true,
  fixedExtension: false,
});
