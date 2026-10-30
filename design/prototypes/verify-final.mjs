/* global console, process, document, window, getComputedStyle, URL */
import assert from 'node:assert/strict'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'
import { fixture as f } from './shared/fixture.js'

const root = dirname(fileURLToPath(import.meta.url))
const base = process.env.PROTOTYPE_URL || 'http://127.0.0.1:4175'
const output = resolve(root, 'screenshots/final')
const extra = resolve(root, '../../test-results/prototypes/final')
await mkdir(output, { recursive: true })
await mkdir(extra, { recursive: true })
const palettes = ['signature', 'analytical', 'warm']
const themes = ['dark', 'light']
const widths = [320, 560, 700, 768, 900, 1024, 1200, 1920]
const errors = [],
  external = [],
  views = [],
  contrast = [],
  parity = new Map()
const browser = await chromium.launch({ headless: true })
const url = (palette, theme, extra = '') =>
  `${base}/final-observatory/?palette=${palette}&theme=${theme}${extra}`
assert.equal(
  f.buckets.reduce((sum, b) => sum + b.virtualSizeBytes, 0),
  f.mempool.virtualSizeBytes,
)

async function layout(page, label) {
  const result = await page.evaluate(() => {
    const svg = document.querySelector('#histogram svg')
    const visible = [...document.querySelectorAll('body *')].filter(
      (el) => el.getClientRects().length && !el.closest('.sr-only, .skip'),
    )
    const smallText = visible
      .filter(
        (el) =>
          [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) &&
          parseFloat(getComputedStyle(el).fontSize) < 12,
      )
      .map((el) => el.textContent)
    const chartBounds =
      !svg ||
      [...svg.querySelectorAll('text')].every((el) => {
        const r = el.getBBox()
        return (
          r.x >= 0 &&
          r.y >= 0 &&
          r.x + r.width <= svg.viewBox.baseVal.width &&
          r.y + r.height <= svg.viewBox.baseVal.height
        )
      })
    const labels = svg ? [...svg.querySelectorAll('.bar-value')].map((el) => el.getBBox()) : []
    return {
      overflow: document.documentElement.scrollWidth > window.innerWidth,
      smallText,
      chartBounds,
      labelOverlap: labels.some(
        (r, i) =>
          i &&
          r.x < labels[i - 1].x + labels[i - 1].width &&
          r.y < labels[i - 1].y + labels[i - 1].height &&
          r.y + r.height > labels[i - 1].y,
      ),
    }
  })
  assert.deepEqual(
    result,
    { overflow: false, smallText: [], chartBounds: true, labelOverlap: false },
    label,
  )
}

async function geometry(page) {
  return page.evaluate(() =>
    [...document.querySelectorAll('.site-header *, main *, footer *')]
      .filter((el) => el.getClientRects().length && !el.closest('.sr-only'))
      .map((el) => {
        const r = el.getBoundingClientRect(),
          s = getComputedStyle(el)
        return [
          el.tagName,
          el.classList.value,
          ...[r.x, r.y, r.width, r.height].map((v) => +v.toFixed(3)),
          s.fontFamily,
          s.fontSize,
          s.fontWeight,
          el.textContent,
        ]
      }),
  )
}

async function contrasts(page, palette, theme) {
  const pairs = await page.evaluate(() => {
    const style = getComputedStyle(document.documentElement)
    const token = (name) => style.getPropertyValue(`--${name}`).trim()
    const luminance = (hex) =>
      hex
        .match(/[a-f\d]{2}/gi)
        .map((c) => parseInt(c, 16) / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0)
    const checks = ['bg', 'surface', 'rail', 'subtle', 'selected'].flatMap((bg) => [
      ['text', bg, 4.5],
      ['muted', bg, 4.5],
    ])
    checks.push(
      ['accent', 'bg', 4.5],
      ['accent', 'surface', 4.5],
      ['accent', 'brand-wash', 4.5],
      ['accent', 'selected', 4.5],
      ['bar', 'surface', 3],
      ['bar', 'rail', 3],
      ['data', 'surface', 3],
      ['data', 'selected', 3],
      ['control', 'surface', 3],
      ['control', 'rail', 3],
      ['warning', 'subtle', 4.5],
      ['danger', 'subtle', 4.5],
      ['positive', 'surface', 4.5],
    )
    return checks.map(([fg, bg, min]) => {
      const a = luminance(token(fg)),
        b = luminance(token(bg))
      return {
        fg,
        bg,
        foreground: token(fg),
        background: token(bg),
        ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05),
        min,
      }
    })
  })
  for (const pair of pairs)
    assert.ok(pair.ratio >= pair.min, `${palette}/${theme}: ${JSON.stringify(pair)}`)
  contrast.push({ palette, theme, pairs })
}

try {
  for (const palette of palettes) {
    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 390, height: 844 },
    ]) {
      for (const theme of themes) {
        const name = `${palette}-${viewport.width}x${viewport.height}-${theme}`
        const context = await browser.newContext({
          viewport,
          deviceScaleFactor: 1,
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
        await page.goto(url(palette, theme, '&capture=1'))
        await page.evaluate(() => document.fonts.ready)
        await page.locator('[data-bucket="1"]').waitFor()
        await layout(page, name)
        assert.match(
          await page.locator('body').evaluate((el) => getComputedStyle(el).fontFamily),
          /Manrope/,
        )
        for (const weight of [400, 500, 600, 700])
          assert.equal(
            await page.evaluate((w) => document.fonts.check(`${w} 14px Manrope`), weight),
            true,
          )
        assert.match(await page.locator('[data-mempool="size"]').innerText(), /13,84/)
        assert.match(await page.locator('[data-mempool="count"]').innerText(), /8\.426/)
        assert.match(await page.locator('[data-mempool="fees"]').innerText(), /48\.320\.000/)
        assert.match(await page.locator('#inspection').innerText(), /4,38/)
        assert.equal(await page.locator('[data-block]').count(), 5)
        const key = `${viewport.width}/${theme}`,
          measured = await geometry(page)
        if (parity.has(key))
          assert.deepEqual(
            measured,
            parity.get(key),
            `${name}: palette changed geometry, typography or content`,
          )
        else parity.set(key, measured)
        if (viewport.width === 1440) await contrasts(page, palette, theme)
        await page.screenshot({ path: resolve(output, `${name}.png`) })
        await page.screenshot({ path: resolve(output, `${name}-full.png`), fullPage: true })

        // Preview and pinned selection are distinct; hovering never changes aria-pressed.
        if (viewport.width === 1440) {
          await page.locator('[data-bucket="3"]').hover()
          assert.match(await page.locator('#inspection').innerText(), /Vorschau/i)
          assert.equal(await page.locator('[data-bucket="1"]').getAttribute('aria-pressed'), 'true')
          await page.locator('h1').hover()
          assert.match(await page.locator('#inspection').innerText(), /4,38/)
        }
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
          for (const selector of [
            '#bucket-choice',
            '#theme',
            '[data-block="0"]',
            '.navigation a',
          ]) {
            assert.ok(
              await page
                .locator(selector)
                .first()
                .evaluate((el) => el.getBoundingClientRect().height >= 44),
              `${selector}: touch height`,
            )
          }
        }
        await page.locator('[data-block="2"]').click()
        assert.match(await page.locator('#block-detail').innerText(), /968\.419/)
        assert.match(await page.locator('#block-detail').innerText(), /3\.984\.652 WU/)
        // Show the review controls; changing palette must retain all user selections and state.
        await page.evaluate(() => delete document.documentElement.dataset.capture)
        const before = await page.locator('#inspection').innerText()
        for (const next of palettes) {
          await page.locator(`button[data-palette="${next}"]`).click()
          assert.equal(await page.locator('html').getAttribute('data-palette'), next)
          assert.equal(await page.locator('#inspection').innerText(), before)
          assert.equal(await page.locator('[data-block="2"]').getAttribute('aria-pressed'), 'true')
          await layout(page, `${name}/review/${next}`)
        }
        await page.locator(`button[data-palette="${palette}"]`).click()
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
        await layout(page, `${name}/tools-open`)
        if (palette === 'analytical' && theme === 'dark')
          await page
            .locator('.size-sample')
            .screenshot({ path: resolve(output, `typography-${viewport.width}.png`) })
        for (const state of ['stale', 'missing']) {
          await page.locator('#data-state').selectOption(state)
          await layout(page, `${name}/${state}`)
          assert.equal(
            await page.locator('.snapshot-chip').first().getAttribute('data-state'),
            state,
          )
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
        assert.equal(await page.locator('[data-block="2"]').getAttribute('aria-pressed'), 'true')
        assert.equal(
          await page
            .locator('.chart-bar')
            .first()
            .evaluate((el) => getComputedStyle(el).animationName),
          'none',
        )
        views.push({ palette, theme, viewport, screenshot: `${name}.png` })
        await context.close()
      }
    }
  }
  const page = await browser.newPage({ reducedMotion: 'reduce' })
  let additionalLayouts = 0
  for (const width of widths) {
    await page.setViewportSize({ width, height: 900 })
    for (const palette of palettes)
      for (const theme of themes)
        for (const state of ['snapshot', 'stale', 'missing']) {
          await page.goto(url(palette, theme, `&state=${state}`))
          await page.evaluate(() => document.fonts.ready)
          await layout(page, `${palette}/${theme}/${width}/${state}`)
          additionalLayouts++
        }
  }
  await page.goto(`${base}/final-observatory/compare.html`)
  await page.evaluate(() => document.fonts.ready)
  await page.locator('img').evaluateAll((imgs) => Promise.all(imgs.map((img) => img.decode())))
  for (const device of ['desktop', 'mobile'])
    for (const theme of themes) {
      await page
        .locator(`#${device}-${theme}`)
        .screenshot({ path: resolve(output, `comparison-${device}-${theme}.png`) })
    }
  await page.close()
  assert.deepEqual(errors, [])
  assert.deepEqual(external, [])

  async function files(path) {
    return (
      await Promise.all(
        (await readdir(path, { withFileTypes: true })).map((entry) =>
          entry.isDirectory() ? files(resolve(path, entry.name)) : resolve(path, entry.name),
        ),
      )
    ).flat()
  }
  const dist = resolve(root, '../../dist'),
    built = await files(dist)
  const fonts = (await files(resolve(root, 'shared/fonts'))).filter((path) => /manrope/.test(path))
  for (const path of built) {
    assert.doesNotMatch(relative(dist, path), /prototype|observatory|manrope|palettes/i)
    const content = await readFile(path)
    for (const font of fonts) assert.equal(content.equals(await readFile(font)), false)
    if (/\.(html|js|css|json)$/.test(path))
      assert.doesNotMatch(
        content.toString('utf8'),
        /OBS-01|Final Observatory|final-observatory|Manrope|Bitcoin Signature|Bitcoin Analytical|Warm Bitcoin/,
      )
  }
  const result = {
    views,
    additionalLayouts,
    widths,
    contrast,
    geometryParity:
      'Identical element rectangles, text, font families, sizes and weights across palettes at both target sizes and modes',
    runtimeErrors: errors,
    externalRequests: external,
    buildIsolation: `${built.length} dist files checked`,
    visualApproval: 'Operator review pending',
  }
  await writeFile(resolve(extra, 'report.json'), JSON.stringify(result, null, 2) + '\n')
  console.log(
    JSON.stringify(
      {
        views: views.length,
        additionalLayouts,
        contrastPairs: contrast.reduce((s, c) => s + c.pairs.length, 0),
        geometryParity: true,
        runtimeErrors: errors,
        externalRequests: external,
        buildIsolation: result.buildIsolation,
      },
      null,
      2,
    ),
  )
} finally {
  await browser.close()
}
