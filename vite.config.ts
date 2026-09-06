import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'
import dts from 'vite-plugin-dts';
import { benchmarkRendererSources } from './vite.benchmark-renderers'

function compactLibraryPlugin() {
  return {
    name: 'compact-library-output',
    renderChunk(code: string) {
      return {
        // Vite deliberately preserves whitespace for ES library output. Remove
        // emitted API docs while keeping Rollup's /* @__PURE__ */ annotations.
        code: code
          .replace(/\/\*\*[\s\S]*?\*\//g, '')
          .replace(/^[ ]{4,}/gm, ''),
        map: null
      }
    }
  }
}

export default defineConfig({
  publicDir: false,
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
  plugins: [
    benchmarkRendererSources({
      // `yarn dev` serves the existing docs URL from the repository root.
      requestPrefix: '/docs/benchmark/renderers/',
    }),
    dts(),
    compactLibraryPlugin()
  ],
})
