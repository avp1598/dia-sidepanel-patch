import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: { index: "src/index.ts" },
    format: ["esm", "cjs"],
    dts: true,
    clean: true,
  },
  {
    entry: { "index.iife": "src/index.ts" },
    format: ["iife"],
    globalName: "ChromeSidePanelPolyfill",
  },
]);
