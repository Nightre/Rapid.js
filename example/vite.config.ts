import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
    base: '/Rapid.js/example/',
    root: __dirname,
    build: {
        outDir: path.resolve(__dirname, '../pages-dist/example'),
        emptyOutDir: true,
        target: 'esnext',
    },
})

