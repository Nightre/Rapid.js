import { defineConfig } from "vite"

export default defineConfig({
  publicDir: false,
  build: {
    outDir: "test-dist",
    target: "esnext",
    minify: false,
    lib: {
      entry: "./tests/internal-entry.ts",
      formats: ["es"],
      fileName: "rapid-render-internal",
    },
  },
})
