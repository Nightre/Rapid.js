import { defineConfig } from 'vite'
import { cpSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const fromRoot = (path: string) => fileURLToPath(new URL(path, import.meta.url))

export default defineConfig({
  root: './docs',
  base: './',
  // Not `publicDir: 'image'`: that flattens docs/image/* into the root of
  // dist, so a runtime path like "./image/toycar.png" resolves in dev and
  // 404s in the build. The images are copied below instead, keeping the same
  // layout in dist as on disk.
  publicDir: false,
  resolve: {
    alias: {
      // Demo sources are shown to the reader verbatim, so they import the
      // package by name rather than a relative path into src/.
      'rapid-render': fromRoot('./src/index.ts'),
    },
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    target: 'esnext',
  },
  plugins: [
    {
      name: 'copy-demo-images',
      closeBundle() {
        cpSync(fromRoot('./docs/image'), fromRoot('./docs/dist/image'), {
          recursive: true,
        })
      },
    },
  ],
})
