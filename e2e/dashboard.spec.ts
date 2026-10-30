import { test, expect } from './fixtures'

const views = [
  ['/', 'Übersicht'],
  ['/market', 'Markt'],
  ['/blockchain', 'Blockchain'],
  ['/mining', 'Netzwerk & Mining'],
] as const

test('home renders data and navigation reaches all four views', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Übersicht', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: '900.000', exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  for (const [path, title] of [...views.slice(1), views[0]]) {
    await page.getByRole('navigation').getByRole('link', { name: title, exact: true }).click()
    await expect(page).toHaveURL(path)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await expect(
      page.getByRole('navigation').getByRole('link', { name: title, exact: true }),
    ).toHaveAttribute('aria-current', 'page')
  }
})

for (const [path, title] of views.slice(1)) {
  test(`direct entry and reload: ${path}`, async ({ page }) => {
    const response = await page.goto(path)
    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
    await page.reload()
    await expect(page).toHaveURL(path)
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible()
  })
}

test('unknown frontend route renders React 404 and a working return link', async ({ page }) => {
  await page.goto('/does-not-exist/deep-link')
  await expect(page.getByRole('heading', { name: 'Seite nicht gefunden' })).toBeVisible()
  await page.getByRole('link', { name: 'Zur Übersicht', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Übersicht', exact: true })).toBeVisible()
})

for (const status of [401, 403, 502, 504]) {
  test.describe(`API ${status}`, () => {
    test.use({ apiStatus: status })
    test('preserves the application and navigation', async ({ page }) => {
      await page.goto('/blockchain')
      await expect(page.getByRole('alert').first()).toContainText(
        status < 500 ? 'Zugriff verweigert' : 'Daten konnten nicht geladen werden',
      )
      await expect(
        page.getByRole('button', { name: 'Erneut versuchen', exact: true }).first(),
      ).toBeVisible()
      await page.getByRole('navigation').getByRole('link', { name: 'Markt', exact: true }).click()
      await expect(page.getByRole('heading', { name: 'Markt', exact: true })).toBeVisible()
    })
  })
}

test('light and dark themes persist after reload', async ({ page }) => {
  await page.goto('/mining')
  await expect(page.locator('html')).toHaveClass(/dark/)
  await page.getByRole('button', { name: 'Light Mode aktivieren' }).click()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.reload()
  await expect(page.getByRole('button', { name: 'Dark Mode aktivieren' })).toBeVisible()
  await expect(page.locator('html')).not.toHaveClass(/dark/)
  await page.getByRole('button', { name: 'Dark Mode aktivieren' }).click()
  await page.reload()
  await expect(page.locator('html')).toHaveClass(/dark/)
})
