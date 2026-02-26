import { defineConfig } from 'vite'

export default defineConfig({
    base: '/Rapid.js/example/',
    root: '.',
    build: {
        outDir: 'pages-dist/example',
        emptyOutDir: true,
    },
})
