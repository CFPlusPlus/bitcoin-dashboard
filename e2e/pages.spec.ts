import { test, expect, type APIResponse } from '@playwright/test'
import { readdirSync } from 'node:fs'

// Real HTTP requests to Wrangler; no browser interception and no upstream GETs.
function expectJson(response: APIResponse, status: number) {
  expect(response.status(), response.url()).toBe(status)
  expect(response.headers()['content-type']).toContain('application/json')
  expect(response.headers()['cache-control']).toBe('no-store')
  expect(response.headers()['x-content-type-options']).toBe('nosniff')
  expect(response.headers()['x-frame-options']).toBe('DENY')
  expect(response.headers()['referrer-policy']).toBe('no-referrer')
}

test('health is served by the real Pages Function', async ({ request }) => {
  const response = await request.get('/api/health')
  expectJson(response, 200)
  expect(await response.json()).toEqual({ status: 'ok', service: 'bitcoin-dashboard' })
  const unsupported = await request.post('/api/health')
  expectJson(unsupported, 405)
  expect(unsupported.headers().allow).toBe('GET')
  expect(await unsupported.json()).toEqual({ error: 'Method not allowed' })
})

for (const path of [
  '/api',
  '/api/',
  '/api/unknown',
  '/api/unknown/nested',
  '/api/bitcoin/unknown',
  '/api/bitcoin/height/nested',
]) {
  test(`unknown API route returns JSON 404: ${path}`, async ({ request }) => {
    const response = await request.get(path)
    expectJson(response, 404)
    expect(await response.json()).toEqual({ error: 'API endpoint not found' })
  })
}

for (const resource of [
  'height',
  'latest-block',
  'blocks',
  'fees',
  'mempool',
  'difficulty-adjustment',
]) {
  test(`supported route dispatches to Bitcoin Function without upstream: ${resource}`, async ({
    request,
  }) => {
    const response = await request.post(`/api/bitcoin/${resource}`)
    expectJson(response, 405)
    expect(response.headers().allow).toBe('GET')
    expect(await response.json()).toEqual({ error: 'Method not allowed' })
  })
}

test('Pages serves SPA deep links and real JavaScript/CSS assets with security headers', async ({
  request,
}) => {
  const home = await request.get('/')
  const html = await home.text()
  expect(home.status()).toBe(200)
  expect(home.headers()['content-type']).toContain('text/html')
  expect(html).toContain('<div id="root"></div>')
  for (const path of ['/market', '/blockchain', '/mining', '/unknown/deep-link']) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(200)
    expect(response.headers()['content-type']).toContain('text/html')
    expect(await response.text()).toBe(html)
  }
  for (const extension of ['js', 'css']) {
    const asset = html.match(new RegExp(`(?:src|href)="([^"?]+\\.${extension})"`))?.[1]
    expect(asset, `Built index must reference a ${extension} asset`).toBeTruthy()
    const response = await request.get(asset!)
    expect(response.status(), asset).toBe(200)
    expect(response.headers()['content-type']).toMatch(
      extension === 'js' ? /javascript/ : /text\/css/,
    )
    expect(response.headers()['x-content-type-options']).toBe('nosniff')
    expect(response.headers()['x-frame-options']).toBe('DENY')
    expect(response.headers()['referrer-policy']).toBe('strict-origin-when-cross-origin')
    expect(await response.text()).not.toContain('<div id="root">')
  }
})

test('production contains only curated font assets and excludes isolated design prototypes', async ({
  request,
}) => {
  const files = readdirSync('dist', { recursive: true, encoding: 'utf8' }).map((path) =>
    path.replaceAll('\\', '/'),
  )
  expect(files.filter((path) => /(^|\/)(design|prototypes|screenshots)(\/|$)/.test(path))).toEqual(
    [],
  )
  expect(files.some((path) => /final-observatory|fixture\.js|palettes\.css/.test(path))).toBe(false)
  expect(files.filter((path) => path.endsWith('.woff2'))).toHaveLength(6)
  for (const family of ['manrope', 'inter']) {
    const license = await request.get(`/fonts/${family}-LICENSE.txt`)
    expect(license.status()).toBe(200)
    expect(await license.text()).toContain('SIL OPEN FONT LICENSE')
  }
})
