import { cpSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Plugin } from 'vite'

const rendererSourceDir = fileURLToPath(
  new URL('./docs/benchmark/renderers', import.meta.url),
)

interface RendererSourcePluginOptions {
  requestPrefix: string
  copyTo?: string
}

export const benchmarkRendererSources = ({
  requestPrefix,
  copyTo,
}: RendererSourcePluginOptions): Plugin => ({
  name: 'raw-benchmark-renderers',
  enforce: 'pre',
  configureServer(server) {
    // Renderer files are fetched as text and executed with new Function().
    // Handle them before Vite transforms JavaScript so the displayed and
    // executed source is byte-for-byte the file checked into the repository.
    server.middlewares.use((request, response, next) => {
      const pathname = new URL(request.url ?? '/', 'http://vite.local').pathname
      if (!pathname.startsWith(requestPrefix)) {
        next()
        return
      }

      const fileName = basename(decodeURIComponent(pathname))
      if (!/^[a-z0-9-]+\.js$/i.test(fileName)) {
        next()
        return
      }

      try {
        const source = readFileSync(join(rendererSourceDir, fileName), 'utf8')
        response.statusCode = 200
        response.setHeader('Content-Type', 'text/javascript; charset=utf-8')
        response.setHeader('Cache-Control', 'no-cache')
        response.end(source)
      } catch {
        next()
      }
    })
  },
  closeBundle() {
    if (!copyTo) return
    cpSync(rendererSourceDir, copyTo, { recursive: true })
  },
})
