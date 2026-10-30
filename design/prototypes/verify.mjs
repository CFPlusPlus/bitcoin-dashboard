/* global console, process, document, window, getComputedStyle, URL */
import assert from 'node:assert/strict'
import { mkdir, readdir, readFile } from 'node:fs/promises'
import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { fixture } from './shared/fixture.js'

const root = dirname(fileURLToPath(import.meta.url))
const base = process.env.PROTOTYPE_URL || 'http://127.0.0.1:4175'
const output = resolve(root, 'screenshots')
const extra = resolve(root, '../../test-results/prototypes')
await mkdir(output, { recursive: true })
await mkdir(extra, { recursive: true })
assert.equal(
  fixture.buckets.reduce((sum, b) => sum + b.virtualSizeBytes, 0),
  fixture.mempool.virtualSizeBytes,
)
const browser = await chromium.launch({ headless: true })
const report = []
try {
  for (const variant of ['analytical', 'refined']) {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      for (const theme of ['dark', 'light']) {
        const context = await browser.newContext({
          viewport,
          reducedMotion: 'reduce',
          hasTouch: viewport.width === 390,
        })
        const page = await context.newPage()
        const errors = [],
          external = []
        page.on('pageerror', (error) => errors.push(error.message))
        page.on('request', (request) => {
          if (new URL(request.url()).origin !== new URL(base).origin) external.push(request.url())
        })
        page.on('console', (message) => {
          if (message.type() === 'error') errors.push(message.text())
        })
        await page.goto(`${base}/${variant}-observatory/?theme=${theme}`)
        await page.evaluate(() => document.fonts.ready)
        await page.locator('[data-bucket]').first().waitFor()
        assert.equal(
          await page.evaluate(
            () =>
              document.fonts.check('400 14px Plex') && document.fonts.check('400 14px "Plex Mono"'),
          ),
          true,
        )
        const overflow = await page.evaluate(() => ({
          page: document.documentElement.scrollWidth,
          viewport: window.innerWidth,
        }))
        assert.ok(
          overflow.page <= overflow.viewport,
          `${variant} ${theme}: page overflow ${JSON.stringify(overflow)}`,
        )
        const axesInside = await page.locator('#histogram svg').evaluate((svg) => {
          const width = svg.viewBox.baseVal.width,
            height = svg.viewBox.baseVal.height
          return [...svg.querySelectorAll('text')].every((text) => {
            const b = text.getBBox()
            return b.x >= 0 && b.y >= 0 && b.x + b.width <= width && b.y + b.height <= height
          })
        })
        assert.ok(axesInside, 'All chart labels must fit inside the SVG')
        const file = `${variant}-${viewport.width}x${viewport.height}-${theme}.png`
        await page.screenshot({ path: resolve(output, file) })
        await page.screenshot({ path: resolve(extra, file), fullPage: true })
        const bucket = page.locator('[data-bucket="1"]')
        await bucket.focus()
        await page.keyboard.press('ArrowRight')
        await page.keyboard.press('Enter')
        assert.match(await page.locator('#inspection').innerText(), /3,26 MvB/)
        await page.keyboard.press('Escape')
        assert.match(await page.locator('#inspection').innerText(), /Gesamter Mempool/i)
        if (viewport.width === 390) {
          await page.locator('#bucket-choice').selectOption('6')
          assert.match(await page.locator('#inspection').innerText(), /0,66 MvB/)
          assert.ok(
            await page
              .locator('#bucket-choice')
              .evaluate((el) => el.getBoundingClientRect().height >= 44),
          )
        }
        await page.locator('[data-block="2"]').click()
        assert.match(await page.locator('#block-detail').innerText(), /968\.419/)
        assert.match(await page.locator('#block-detail').innerText(), /3\.984\.652 WU/)
        await page.locator('#theme').click()
        assert.equal(
          await page.locator('html').getAttribute('data-theme'),
          theme === 'dark' ? 'light' : 'dark',
        )
        await page.locator('.prototype-tools summary').click()
        await page.locator('#data-state').selectOption('stale')
        assert.match(await page.locator('#mempool-warning').innerText(), /Veraltete Beispieldaten/)
        assert.match(await page.locator('[data-mempool="size"]').innerText(), /13,84/)
        await page.locator('#data-state').selectOption('missing')
        assert.equal(await page.locator('[data-bucket]').count(), 0)
        assert.equal(await page.locator('[data-mempool="size"]').innerText(), '—')
        assert.equal(
          await page
            .locator('#source-mempool')
            .evaluate((el) => el.parentElement.querySelector('time').hidden),
          true,
        )
        assert.equal(await page.locator('[data-block]').count(), fixture.blocks.length)
        await page.locator('#retry').click()
        assert.equal(await page.locator('[data-bucket]').count(), fixture.buckets.length)
        assert.match(await page.locator('#refresh-status').innerText(), /keine Netzwerkabfrage/)
        await page.locator('#font-choice').selectOption('inter')
        await page.evaluate(() => document.fonts.ready)
        assert.match(
          await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily),
          /Inter/,
        )
        assert.deepEqual(errors, [])
        assert.deepEqual(external, [])
        report.push({
          variant,
          viewport,
          theme,
          screenshot: file,
          pageOverflow: false,
          chartLabelsInside: true,
          runtimeErrors: errors.length,
          externalRequests: external.length,
        })
        await context.close()
      }
    }
    const page = await browser.newPage()
    for (const width of [320, 560, 768, 1024, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      await page.goto(`${base}/${variant}-observatory/`)
      await page.evaluate(() => document.fonts.ready)
      assert.ok(
        await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
        `${variant}: overflow at ${width}px`,
      )
    }
    await page.close()
  }
} finally {
  await browser.close()
}

// Vite's actual output must contain none of the isolated source or font assets.
const dist = resolve(root, '../../dist')
async function files(path) {
  const entries = await readdir(path, { withFileTypes: true })
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory() ? files(resolve(path, entry.name)) : resolve(path, entry.name),
      ),
    )
  ).flat()
}
const built = await files(dist)
for (const path of built) {
  assert.doesNotMatch(relative(dist, path), /prototype|observatory|plex/i)
  if (/\.(html|js|css|json)$/.test(path))
    assert.doesNotMatch(
      await readFile(path, 'utf8'),
      /OBS-01|Designexperiment|Analytical Observatory|Refined Observatory|ibm-plex/,
    )
}
console.log(
  JSON.stringify(
    {
      views: report,
      intermediateWidths: [320, 560, 768, 1024, 1920],
      fixtureSum: '13.84 MvB',
      buildIsolation: `${built.length} dist files checked; no prototype content`,
    },
    null,
    2,
  ),
)
