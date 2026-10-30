/* global console, process, document, window, getComputedStyle, URL */
import assert from 'node:assert/strict'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { fixture as f } from './shared/fixture.js'

const root = dirname(fileURLToPath(import.meta.url))
const base = process.env.PROTOTYPE_URL || 'http://127.0.0.1:4175'
const output = resolve(root, 'screenshots')
const extra = resolve(root, '../../test-results/prototypes')
await mkdir(extra, { recursive: true })
assert.equal(
  f.buckets.reduce((sum, b) => sum + b.virtualSizeBytes, 0),
  f.mempool.virtualSizeBytes,
)
const variants = [
  { id: 'precision', path: 'contemporary-precision', font: 'Inter' },
  { id: 'expressive', path: 'expressive-observatory', font: 'Manrope' },
]
const browser = await chromium.launch({ headless: true })
const report = []
const contrast = []
const errors = [],
  external = []

async function checkLayout(page, label) {
  assert.ok(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    `${label}: page overflow`,
  )
  if (await page.locator('#histogram svg').count()) {
    assert.ok(
      await page.locator('#histogram svg').evaluate((svg) => {
        return [...svg.querySelectorAll('text')].every((text) => {
          const b = text.getBBox()
          return (
            b.x >= 0 &&
            b.y >= 0 &&
            b.x + b.width <= svg.viewBox.baseVal.width &&
            b.y + b.height <= svg.viewBox.baseVal.height
          )
        })
      }),
      `${label}: chart labels outside SVG`,
    )
  }
}
try {
  for (const v of variants) {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      for (const theme of ['dark', 'light']) {
        const context = await browser.newContext({
          viewport,
          hasTouch: viewport.width === 390,
          reducedMotion: 'reduce',
        })
        const page = await context.newPage()
        page.on('pageerror', (e) => errors.push(e.message))
        page.on('console', (m) => {
          if (m.type() === 'error') errors.push(m.text())
        })
        await page.route('**/*', (route) => {
          if (new URL(route.request().url()).origin !== new URL(base).origin) {
            external.push(route.request().url())
            return route.abort()
          }
          return route.continue()
        })
        const url = `${base}/${v.path}/?theme=${theme}`
        await page.goto(url)
        await page.evaluate(() => document.fonts.ready)
        await page.locator('[data-bucket]').first().waitFor()
        await checkLayout(page, `${v.id}/${viewport.width}/${theme}`)
        assert.match(
          await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily),
          new RegExp(v.font),
        )
        assert.equal(
          await page.evaluate((font) => document.fonts.check(`400 14px ${font}`), v.font),
          true,
        )
        assert.match(await page.locator('[data-mempool="size"]').innerText(), /13,84/)
        assert.match(await page.locator('[data-mempool="count"]').innerText(), /8\.426/)
        assert.match(await page.locator('[data-mempool="fees"]').innerText(), /48\.320\.000/)
        assert.equal(await page.locator('[data-block]').count(), f.blocks.length)
        const name = `${v.id}-${viewport.width}x${viewport.height}-${theme}`
        await page.screenshot({ path: resolve(output, `${name}.png`) })
        await page.screenshot({
          path: resolve(viewport.width === 1440 ? output : extra, `${name}-full.png`),
          fullPage: true,
        })

        // Effective foreground/background pairs, including the theme-inverted network surface.
        const pairs = await page.evaluate(() => {
          const selectors = [
            ['body', '--text', '--bg', 4.5],
            ['.chart-panel', '--muted', '--surface', 4.5],
            ['.chart-panel', '--data', '--surface', 4.5],
            ['.chart-panel', '--bar', '--surface', 3],
            ['.chart-panel', '--warning', '--subtle', 4.5],
            ['.context-rail', '--muted', null, 4.5],
            ['.context-rail', '--data', null, 3],
            ['.inspection', '--muted', null, 4.5],
          ]
          function rgb(c) {
            const probe = document.createElement('span')
            probe.style.color = c
            document.body.append(probe)
            const value = getComputedStyle(probe)
              .color.match(/[\d.]+/g)
              .slice(0, 3)
              .map(Number)
            probe.remove()
            return value
          }
          const luminance = (c) =>
            rgb(c)
              .map((x) => {
                x /= 255
                return x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4
              })
              .reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0)
          return selectors.map(([selector, fg, bg, min]) => {
            const el = document.querySelector(selector),
              s = getComputedStyle(el)
            let background = bg ? s.getPropertyValue(bg).trim() : s.backgroundColor
            let parent = el
            while (!bg && background === 'rgba(0, 0, 0, 0)' && parent.parentElement) {
              parent = parent.parentElement
              background = getComputedStyle(parent).backgroundColor
            }
            const foreground = s.getPropertyValue(fg).trim()
            const a = luminance(foreground),
              b = luminance(background)
            return {
              selector,
              fg,
              foreground,
              background,
              ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
              min,
            }
          })
        })
        for (const pair of pairs)
          assert.ok(pair.ratio >= pair.min, `${name}: contrast ${JSON.stringify(pair)}`)
        if (viewport.width === 1440) contrast.push({ variant: v.id, theme, pairs })

        await page.locator('[data-bucket="1"]').focus()
        await page.keyboard.press('ArrowRight')
        await page.keyboard.press('Enter')
        assert.match(await page.locator('#inspection').innerText(), /3,26/)
        await page.keyboard.press('Home')
        await page.keyboard.press(' ')
        assert.match(await page.locator('#inspection').innerText(), /0,92/)
        await page.keyboard.press('End')
        await page.keyboard.press('Enter')
        assert.match(await page.locator('#inspection').innerText(), /0,66/)
        await page.keyboard.press('Escape')
        assert.match(await page.locator('#inspection').innerText(), /Gesamter Mempool/i)
        if (viewport.width === 390) {
          await page.locator('[data-bucket="4"]').tap()
          assert.match(await page.locator('#inspection').innerText(), /1,48/)
          await page.locator('#bucket-choice').selectOption('6')
          assert.match(await page.locator('#inspection').innerText(), /0,66/)
          for (const selector of ['#bucket-choice', '#theme', '[data-block="0"]']) {
            assert.ok(
              await page
                .locator(selector)
                .evaluate((el) => el.getBoundingClientRect().height >= 44),
              `${selector}: touch height`,
            )
          }
        } else {
          await page.locator('[data-bucket="3"]').hover()
          assert.match(await page.locator('#inspection').innerText(), /2,18/)
          await page.locator('h1').hover()
          assert.match(await page.locator('#inspection').innerText(), /Gesamter Mempool/i)
        }
        await page.locator('[data-block="2"]').click()
        assert.match(await page.locator('#block-detail').innerText(), /968\.419/)
        assert.match(await page.locator('#block-detail').innerText(), /3\.984\.652 WU/)
        await page.locator('#theme').click()
        assert.equal(
          await page.locator('html').getAttribute('data-theme'),
          theme === 'dark' ? 'light' : 'dark',
        )
        assert.match(
          await page.locator('#compare-variant').getAttribute('href'),
          new RegExp(`theme=${theme === 'dark' ? 'light' : 'dark'}`),
        )
        await page.locator('#theme').click()
        await page.locator('[data-scope]').first().click()
        assert.equal(await page.locator('#prototype-scope').getAttribute('open'), '')
        for (const state of ['stale', 'missing']) {
          await page.locator('#data-state').selectOption(state)
          await checkLayout(page, `${name}/${state}`)
          assert.equal(await page.locator('[data-block]').count(), 5)
          if (state === 'stale') {
            assert.match(
              await page.locator('#mempool-warning').innerText(),
              /Veraltete Beispieldaten/,
            )
            assert.match(await page.locator('[data-mempool="size"]').innerText(), /13,84/)
          } else {
            assert.equal(await page.locator('[data-bucket]').count(), 0)
            assert.equal(await page.locator('[data-mempool="size"]').innerText(), '—')
            assert.equal(await page.locator('#bucket-choice').isDisabled(), true)
            assert.equal(
              await page
                .locator('#source-mempool')
                .evaluate((el) => el.parentElement.querySelector('time').hidden),
              true,
            )
          }
          await page
            .locator('.chart-panel')
            .screenshot({ path: resolve(extra, `${name}-${state}.png`) })
        }
        await page.locator('#retry').click()
        assert.equal(await page.locator('[data-bucket]').count(), 7)
        assert.equal(
          await page.locator('[data-bucket="1"]').evaluate((el) => el === document.activeElement),
          true,
        )
        assert.match(
          await page.locator('#refresh-status').innerText(),
          /Identischer Beispielstand.*keine Netzwerkabfrage/,
        )
        await page.locator('#reload-fixture').click()
        assert.match(await page.locator('#inspection').innerText(), /4,38/)
        assert.match(await page.locator('#block-detail').innerText(), /968\.419/)
        for (const [font, family] of [
          ['inter', 'Inter'],
          ['manrope', 'Manrope'],
          ['plex', 'Plex'],
        ]) {
          await page.locator('#font-choice').selectOption(font)
          await page.evaluate(() => document.fonts.ready)
          assert.match(
            await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily),
            new RegExp(family),
          )
          assert.equal(
            await page.evaluate((font) => document.fonts.check(`600 14px ${font}`), family),
            true,
          )
          await checkLayout(page, `${name}/${font}`)
        }
        assert.equal(
          await page
            .locator('.chart-bar')
            .first()
            .evaluate((el) => getComputedStyle(el).transitionDuration),
          '0s',
        )
        report.push({
          variant: v.id,
          viewport,
          theme,
          screenshot: `${name}.png`,
          checks:
            'layout, chart bounds, fonts, data, keyboard, pointer/touch, blocks, themes, states, retry, repeat, reduced motion',
        })
        await context.close()
      }
    }
    const page = await browser.newPage()
    for (const width of [320, 560, 700, 768, 900, 1024, 1920]) {
      await page.setViewportSize({ width, height: 900 })
      for (const theme of ['dark', 'light']) {
        for (const state of ['snapshot', 'stale', 'missing']) {
          await page.goto(`${base}/${v.path}/?theme=${theme}&state=${state}`)
          await page.evaluate(() => document.fonts.ready)
          await checkLayout(page, `${v.id}/${width}/${theme}/${state}`)
          assert.equal(await page.locator('#data-state').inputValue(), state)
        }
      }
    }
    await page.close()
  }
  // Regenerate B under precisely the same browser, viewport, fixture and selection.
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
  })
  for (const theme of ['dark', 'light']) {
    await page.goto(`${base}/refined-observatory/?theme=${theme}`)
    await page.evaluate(() => document.fonts.ready)
    await page.locator('[data-bucket="1"]').waitFor()
    await page.screenshot({ path: resolve(output, `refined-1440x900-${theme}.png`) })
  }
  await page.goto(`${base}/compare.html`)
  await page.evaluate(() => document.fonts.ready)
  await page.locator('img').evaluateAll((imgs) => Promise.all(imgs.map((img) => img.decode())))
  for (const theme of ['dark', 'light'])
    await page
      .locator(`#comparison-${theme}`)
      .screenshot({ path: resolve(output, `comparison-${theme}.png`) })
  await page.close()
} finally {
  await browser.close()
}
assert.deepEqual(errors, [])
assert.deepEqual(external, [])

const dist = resolve(root, '../../dist')
async function files(path) {
  return (
    await Promise.all(
      (await readdir(path, { withFileTypes: true })).map((entry) =>
        entry.isDirectory() ? files(resolve(path, entry.name)) : resolve(path, entry.name),
      ),
    )
  ).flat()
}
const built = await files(dist)
const newAssets = (await files(resolve(root, 'shared/fonts'))).filter((path) =>
  /manrope|inter-latin-700/.test(path),
)
for (const path of built) {
  assert.doesNotMatch(relative(dist, path), /prototype|observatory|precision|manrope|plex/i)
  const content = await readFile(path)
  for (const asset of newAssets)
    assert.equal(content.equals(await readFile(asset)), false, `Prototype font leaked: ${path}`)
  if (/\.(html|js|css|json)$/.test(path))
    assert.doesNotMatch(
      content.toString('utf8'),
      /OBS-01|Designexperiment|Contemporary Precision|Expressive Observatory|refinement-interactions|manrope|ibm-plex/,
    )
}
const result = {
  views: report,
  contrast,
  additionalLayouts: 84,
  intermediateWidths: [320, 560, 700, 768, 900, 1024, 1920],
  runtimeErrors: errors,
  externalRequests: external,
  buildIsolation: `${built.length} dist files checked`,
  visualApproval: 'Operator review pending; automated checks do not approve aesthetics',
}
await writeFile(resolve(extra, 'refinement-report.json'), JSON.stringify(result, null, 2) + '\n')
console.log(
  JSON.stringify(
    {
      views: report.length,
      additionalLayouts: 84,
      contrastPairs: contrast.reduce((s, c) => s + c.pairs.length, 0),
      runtimeErrors: errors,
      externalRequests: external,
      buildIsolation: result.buildIsolation,
    },
    null,
    2,
  ),
)
