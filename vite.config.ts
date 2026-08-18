import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import dts from 'vite-plugin-dts';

export default defineConfig({
  resolve: {
    alias: {
      // `npm run dev` serves the docs from the repo root, and the demo sources
      // under docs/demos import the package by name so the reader sees real
      // usage. Same alias as vite.docs.config.ts.
      'rapid-render': fileURLToPath(new URL('./src/index.ts', import.meta.url)),
    },
  },
  build: {
    lib: {
      entry: './src/index.ts',
      name: 'RapidRender',
      fileName: 'rapid-render',
    },
    target: 'esnext',
  },
  plugins: [dts()],
})
