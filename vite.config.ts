import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: './scr/index.ts',
      name: 'rapid',
      fileName: 'rapid'
    }
  }
})
