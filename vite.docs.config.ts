import { defineConfig } from 'vite'

export default defineConfig({
  root: './docs',
  base: './',
  publicDir: 'image',
  build: {
    outDir: './dist',
    emptyOutDir: true,
    target: 'esnext',
  },
})
