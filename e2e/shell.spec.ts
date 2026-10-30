import { test, expect } from './fixtures'

const views = [
  ['/', 'Übersicht', 'overview'],
  ['/market', 'Markt', 'market'],
  ['/blockchain', 'Blockchain', 'blockchain'],
  ['/mining', 'Netzwerk & Mining', 'mining'],
] as const
const sizes = [
  { width: 1440, height: 900 },
  { width: 1920, height: 1080 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 320, height: 844 },
]

for (const theme of ['dark', 'light'] as const) {
  for (const viewport of sizes) {
    test(`shell ${viewport.width}x${viewport.height} ${theme}: four routes, reflow and local fonts`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport)
      await page.addInitScript((selected) => localStorage.setItem('theme', selected), theme)
      for (const [path, title, slug] of views) {
        await page.goto(path)
        await expect(
          page.getByRole('heading', { level: 1, name: title, exact: true }),
        ).toBeVisible()
        await expect(page).toHaveTitle(`${title} · Bitcoin Dashboard`)
        await page.evaluate(() => document.fonts.ready)
        await expect(page.getByRole('alert')).toHaveCount(0)
        await expect(page.getByRole('navigation').getByRole('link')).toHaveCount(4)
        await expect(page.getByRole('navigation').locator('[aria-current="page"]')).toHaveCount(1)
        await expect(
          page.getByRole('navigation').getByRole('link', { name: title, exact: true }),
        ).toHaveAttribute('aria-current', 'page')
        for (const [, label] of views) {
          const link = page.getByRole('navigation').getByRole('link', { name: label, exact: true })
          await expect(link).toBeVisible()
          const box = await link.boundingBox()
          expect(box!.height).toBeGreaterThanOrEqual(44)
          expect(box!.x).toBeGreaterThanOrEqual(0)
          expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width)
        }
        const layout = await page.evaluate(() => ({
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth,
          titleFont: getComputedStyle(document.querySelector('h1')!).fontFamily,
          metadataFont: getComputedStyle(document.querySelector('.page-source')!).fontFamily,
          manrope: document.fonts.check('500 16px Manrope', 'Übersicht Größe ß'),
          inter: document.fonts.check('400 12px Inter', 'Netzwerk'),
        }))
        expect(layout.pageWidth).toBeLessThanOrEqual(layout.viewportWidth)
        expect(layout.titleFont).toContain('Manrope')
        expect(layout.metadataFont).toContain('Inter')
        expect(layout.manrope && layout.inter).toBe(true)
        if (
          slug === 'blockchain' ||
          (slug === 'overview' && [1440, 390].includes(viewport.width))
        ) {
          // Fixed API fixtures, same-origin fonts and the actual production React build.
          if (slug === 'overview') await expect(page.locator('canvas').first()).toBeVisible()
          await page.screenshot({
            path: `test-results/shell/${slug}-${viewport.width}x${viewport.height}-${theme}.png`,
          })
          if ([1440, 390].includes(viewport.width))
            await page.screenshot({
              path: `test-results/shell/${slug}-${viewport.width}x${viewport.height}-${theme}-full.png`,
              fullPage: true,
            })
        }
      }
    })
  }

  test(`keyboard navigation, skip link and route focus ${theme}`, async ({ page }) => {
    await page.addInitScript((selected) => localStorage.setItem('theme', selected), theme)
    await page.goto('/')
    await page.keyboard.press('Tab')
    const skip = page.getByRole('link', { name: 'Zum Inhalt springen' })
    await expect(skip).toBeFocused()
    await expect(skip).toBeInViewport()
    expect(await skip.evaluate((element) => getComputedStyle(element).outlineStyle)).toBe('solid')
    await page.keyboard.press('Enter')
    await expect(page.getByRole('main')).toBeFocused()
    await page.getByRole('link', { name: 'Markt', exact: true }).focus()
    await page.keyboard.press('Enter')
    await expect(page.getByRole('heading', { level: 1, name: 'Markt', exact: true })).toBeFocused()
    await expect(page).toHaveTitle('Markt · Bitcoin Dashboard')
    await page.goBack()
    await expect(
      page.getByRole('heading', { level: 1, name: 'Übersicht', exact: true }),
    ).toBeFocused()
  })

  test(`shell text and control contrasts ${theme}`, async ({ page }) => {
    await page.addInitScript((selected) => localStorage.setItem('theme', selected), theme)
    await page.goto('/blockchain')
    const contrasts = await page.evaluate(() => {
      const tokens = getComputedStyle(document.documentElement)
      const get = (name: string) => tokens.getPropertyValue(`--${name}`).trim()
      const luminance = (hex: string) => {
        const channels = hex
          .replace(/^#([a-f0-9])([a-f0-9])([a-f0-9])$/i, '#$1$1$2$2$3$3')
          .replace('#', '')
          .match(/../g)!
          .map((channel) => {
            const value = parseInt(channel, 16) / 255
            return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
          })
        return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722
      }
      const ratio = (foreground: string, background: string) => {
        const values = [luminance(get(foreground)), luminance(get(background))].sort(
          (a, b) => b - a,
        )
        return (values[0] + 0.05) / (values[1] + 0.05)
      }
      return {
        text: ['background', 'surface', 'surface-secondary', 'surface-raised', 'selection'].flatMap(
          (surface) =>
            ['foreground', 'foreground-secondary', 'foreground-subtle'].map((text) =>
              ratio(text, surface),
            ),
        ),
        active: ratio('accent', 'accent-surface'),
        button: ratio('accent-foreground', 'accent'),
        states: ['warning', 'danger', 'positive'].map((state) => ratio(state, 'surface')),
        border: ratio('control-border', 'surface'),
        focus: ratio('focus', 'background'),
        dataDistinct:
          get('data-primary') !== get('brand') && get('data-primary') !== get('positive'),
      }
    })
    for (const ratio of [
      ...contrasts.text,
      contrasts.active,
      contrasts.button,
      ...contrasts.states,
    ])
      expect(ratio).toBeGreaterThanOrEqual(4.5)
    expect(contrasts.border).toBeGreaterThanOrEqual(3)
    expect(contrasts.focus).toBeGreaterThanOrEqual(3)
    expect(contrasts.dataDistinct).toBe(true)
  })

  test(`320px shell supports enlarged text and reduced motion ${theme}`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 844 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.addInitScript((selected) => localStorage.setItem('theme', selected), theme)
    for (const [path, title] of views) {
      await page.goto(path)
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%'
      })
      await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(
        320,
      )
    }
    const navigation = page.getByRole('navigation')
    for (const [, title] of views) {
      await expect(navigation.getByRole('link', { name: title, exact: true })).toBeVisible()
    }
    const metrics = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
      duration: getComputedStyle(document.querySelector('.theme-toggle')!).transitionDuration,
    }))
    expect(metrics.width).toBeLessThanOrEqual(metrics.viewport)
    expect(metrics.duration).toBe('0s')
    await page.screenshot({
      path: `test-results/shell/mining-320-text200-${theme}.png`,
      fullPage: true,
    })
    await page
      .getByRole('button', {
        name: theme === 'dark' ? 'Light Mode aktivieren' : 'Dark Mode aktivieren',
      })
      .click()
    await expect(
      page.getByRole('button', {
        name: theme === 'dark' ? 'Dark Mode aktivieren' : 'Light Mode aktivieren',
      }),
    ).toBeVisible()
  })
}

test('persisted light theme is applied by the HTML bootstrap before React loads', async ({
  page,
}) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'light'))
  await page.route('**/assets/*.js', (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: '/* React intentionally delayed for bootstrap verification. */',
    }),
  )
  await page.goto('/')
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  expect(await page.evaluate(() => getComputedStyle(document.body).backgroundColor)).toBe(
    'rgb(243, 244, 245)',
  )
})
