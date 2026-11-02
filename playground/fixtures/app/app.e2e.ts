import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const html = (page: Page) => page.locator('html')
const appRoot = (page: Page) => page.locator('.ui-app')
const host = (page: Page) => page.locator('#ui-overlay-host')
const skipLink = (page: Page) => page.locator('.ui-app__skip-link')

const computed = (locator: Locator, property: string) => locator.evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property)

async function openOwnerPanel(page: Page, id: string) {
  const combobox = page.getByTestId(id)
  await combobox.focus()
  await page.keyboard.press('ArrowDown')
  await expect(combobox).toHaveAttribute('aria-expanded', 'true')
}

test.describe('MApp', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'app/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  for (const theme of THEMES) {
    test(`stress content has no axe violations (${theme})`, async ({ page }) => {
      await openFixture(page, 'app/stress', { theme })
      await expectNoAxeViolations(page)
    })
  }

  for (const width of WIDTHS) {
    test(`matrix and stress content do not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })

      for (const key of ['app/matrix', 'app/stress']) {
        await openFixture(page, key)
        await expectNoHorizontalOverflow(page)
      }
    })
  }

  for (const theme of THEMES) {
    test(`the server HTML already carries the theme and one overlay host (${theme})`, async ({ page }) => {
      const response = await page.request.get(`/app/matrix?theme=${theme}&dir=ltr`)
      const markup = await response.text()
      const htmlTag = markup.match(/<html[^>]*>/)?.[0] ?? ''

      expect(htmlTag).toContain(`data-definition="${theme}"`)
      expect(htmlTag).toMatch(/data-palette="[^"]+"/)
      expect(htmlTag).toMatch(/data-contrast="[^"]+"/)
      expect(markup).toMatch(/<style[^>]*id="material-kit-theme"/)
      expect(markup.match(/id="ui-overlay-host"/g) ?? []).toHaveLength(1)
    })
  }

  for (const theme of THEMES) {
    test(`theme attributes and color-scheme match the requested theme (${theme})`, async ({ page }) => {
      await openFixture(page, 'app/matrix', { theme })

      await expect(html(page)).toHaveAttribute('data-definition', theme)
      await expect(html(page)).toHaveAttribute('data-palette', /.+/)
      await expect(html(page)).toHaveAttribute('data-contrast', /.+/)
      expect(await computed(html(page), 'color-scheme')).toBe(theme)
    })
  }

  test('switching the theme rewrites the html attributes without a reload', async ({ page }) => {
    await openFixture(page, 'app/matrix', { theme: 'light' })
    const marker = await page.evaluate(() => performance.timeOrigin)

    await page.getByTestId('definition-dark').click()
    await expect(html(page)).toHaveAttribute('data-definition', 'dark')
    await expect(page.getByTestId('attr-data-definition')).toHaveText('dark')

    await page.getByTestId('definition-light').click()
    await expect(html(page)).toHaveAttribute('data-definition', 'light')

    expect(await page.evaluate(() => performance.timeOrigin)).toBe(marker)
  })

  // Q1-Б: `system` stays `system` on <html>; the dark palette sits under
  // `prefers-color-scheme: dark`, so the scheme follows the OS without script.
  test('the system definition follows the OS color scheme live', async ({ page }) => {
    const surface = () => page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--md-sys-color-surface').trim())

    await page.emulateMedia({ colorScheme: 'light' })
    await openFixture(page, 'app/matrix', { theme: 'light' })
    const light = await surface()

    await page.getByTestId('definition-dark').click()
    await expect(html(page)).toHaveAttribute('data-definition', 'dark')
    const dark = await surface()
    expect(dark).not.toBe(light)

    await page.getByTestId('definition-system').click()
    await expect(html(page)).toHaveAttribute('data-definition', 'system')
    await expect(page.getByTestId('attr-data-definition')).toHaveText('system')
    await expect.poll(surface).toBe(light)

    await page.emulateMedia({ colorScheme: 'dark' })
    await expect.poll(surface).toBe(dark)
    expect(await computed(html(page), 'color-scheme')).toBe('dark')

    await page.emulateMedia({ colorScheme: 'light' })
    await expect.poll(surface).toBe(light)
    await expect(html(page)).toHaveAttribute('data-definition', 'system')
  })

  for (const theme of THEMES) {
    test(`the root paints the background and on-background roles (${theme})`, async ({ page }) => {
      await openFixture(page, 'app/matrix', { theme })
      const probe = page.getByTestId('role-probe')

      expect(await computed(appRoot(page), 'background-color')).toBe(await computed(probe, 'background-color'))
      expect(await computed(appRoot(page), 'color')).toBe(await computed(probe, 'color'))
    })
  }

  test('the root fills the viewport and grows with tall content', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 })

    await openFixture(page, 'app/matrix')
    const shortfall = await appRoot(page).evaluate(el => window.innerHeight - el.getBoundingClientRect().height)
    expect(shortfall).toBeLessThanOrEqual(1)

    await openFixture(page, 'app/stress')
    const { root, documentHeight } = await appRoot(page).evaluate(el => ({
      root: el.getBoundingClientRect().height,
      documentHeight: document.documentElement.scrollHeight,
    }))
    expect(root).toBeGreaterThan(800)
    expect(documentHeight - root).toBeLessThanOrEqual(1)
  })

  test('the root adds no landmark or role of its own', async ({ page }) => {
    await openFixture(page, 'app/matrix')

    expect(await appRoot(page).evaluate(el => el.tagName.toLowerCase())).toBe('div')
    expect(await appRoot(page).getAttribute('role')).toBeNull()
  })

  test('a dropdown panel opens inside the single overlay host', async ({ page }) => {
    await openFixture(page, 'app/matrix')
    await expect(host(page)).toHaveCount(1)

    await openOwnerPanel(page, 'overlay-probe')

    await expect(host(page).getByRole('listbox')).toBeVisible()
    await expect(host(page)).toHaveCount(1)
  })

  // A closed panel stays on screen for its exit motion: the next owner's panel
  // may open beside it, so each panel is found by its owner's name and the test
  // waits for the closed one to leave before the next owner opens.
  test('many overlay owners still share one host', async ({ page }) => {
    await openFixture(page, 'app/stress')
    await expect(host(page)).toHaveCount(1)

    for (const index of [1, 12]) {
      const id = `owner-${index}`
      await openOwnerPanel(page, id)
      await expect(host(page).getByRole('listbox', { name: `Overlay owner ${index}`, exact: true })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(page.getByTestId(id)).toHaveAttribute('aria-expanded', 'false')
      await expect(host(page).getByRole('listbox')).toHaveCount(0)
    }

    await expect(host(page)).toHaveCount(1)
  })

  test.describe('skip link', () => {
    // playground/app/app.vue gives the MApp a skip link on this fixture only, so
    // the extra Tab stop stays out of every other fixture's keyboard tests.
    test.beforeEach(async ({ page }) => {
      await openFixture(page, 'app/matrix')

      await expect(skipLink(page)).toHaveAttribute('href', '#main')
      await expect(page.locator('#main')).toHaveCount(1)
    })

    test('is the first Tab stop and shows itself only while focused', async ({ page }) => {
      expect(await computed(skipLink(page), 'clip-path')).not.toBe('none')

      await page.keyboard.press('Tab')

      await expect(skipLink(page)).toBeFocused()
      expect(await computed(skipLink(page), 'clip-path')).toBe('none')
      expect((await skipLink(page).boundingBox())!.height).toBeGreaterThanOrEqual(24)
    })

    test('draws a focus ring at least 2px wide', async ({ page }) => {
      await page.keyboard.press('Tab')

      expect(await computed(skipLink(page), 'outline-style')).toBe('solid')
      expect(Number.parseFloat(await computed(skipLink(page), 'outline-width'))).toBeGreaterThanOrEqual(2)
    })

    test('moves the next Tab stop into the target', async ({ page }) => {
      const target = (await skipLink(page).getAttribute('href'))!.slice(1)

      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter')
      await expect(page).toHaveURL(new RegExp(`#${target}$`))

      await page.keyboard.press('Tab')
      expect(await page.evaluate(id => Boolean(document.activeElement?.closest(`#${id}`)), target)).toBe(true)
    })

    test('keeps a visible edge in forced-colors mode', async ({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' })
      await page.keyboard.press('Tab')

      expect(await computed(skipLink(page), 'border-top-style')).toBe('solid')
      expect(Number.parseFloat(await computed(skipLink(page), 'border-top-width'))).toBeGreaterThan(0)
    })
  })
})
