import { defineConfig } from 'vite';
import string from 'vite-plugin-string';
import dts from 'unplugin-dts/vite'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'rapid',
      fileName: (format) => {
        if (format === 'cjs') return 'rapid.umd.cjs';
        if (format === 'es') return 'rapid.js';
        if (format === 'iife') return 'rapid.global.js';
        return 'rapid.js';
      },
      formats: ['cjs', 'es', 'iife'],
    },
    minify: 'terser',
    terserOptions: {
      ecma: 2020,
    },
  },
  plugins: [
    string({
      include: ['**/*.frag', '**/*.vert'],
    }),
    dts()
  ],
});