/* global process, console, URL */
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, extname, sep } from 'node:path'

// Deliberately serves ONLY this experiment directory, never the repository or production app.
const root = dirname(fileURLToPath(import.meta.url))
const port = Number(process.env.PROTOTYPE_PORT || 4175)
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.json': 'application/json; charset=utf-8',
}
const server = createServer(async (request, response) => {
  try {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405)
      response.end()
      return
    }
    const url = new URL(request.url, 'http://127.0.0.1')
    let path = resolve(root, `.${decodeURIComponent(url.pathname)}`)
    if (!path.startsWith(root + sep) && path !== root) {
      response.writeHead(403)
      response.end()
      return
    }
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html')
    const content = await readFile(path)
    response.writeHead(200, {
      'Content-Type': mime[extname(path)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'Content-Security-Policy':
        "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    })
    response.end(request.method === 'HEAD' ? undefined : content)
  } catch {
    response.writeHead(404)
    response.end('Not found')
  }
})
server.listen(port, '127.0.0.1', () =>
  console.log(`Observatory prototypes: http://127.0.0.1:${port}/`),
)
