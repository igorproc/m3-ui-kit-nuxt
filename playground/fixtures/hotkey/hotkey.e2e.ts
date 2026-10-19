import { expect, test } from '@playwright/test'
import type { Browser, Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0 Safari/537.36'

const style = (locator: Locator, property: string) =>
  locator.evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property)
const keycaps = (locator: Locator) => locator.locator('.ui-hotkey__combo:not(.ui-hotkey__combo--reserve) .ui-hotkey__key')

function openingTag(html: string, testId: string): string {
  return html.match(new RegExp(`<span[^>]*data-test="${testId}"[^>]*>`))?.[0] ?? ''
}

async function hintWidthWithUnknownServerPlatform(browser: Browser, baseURL: string | undefined, javaScriptEnabled: boolean): Promise<number> {
  const context = await browser.newContext({ baseURL, javaScriptEnabled, userAgent: MAC_UA })
  const page = await context.newPage()
  await page.addInitScript(() => {
    Object.defineProperty(Navigator.prototype, 'userAgentData', { get: () => ({ platform: 'macOS' }) })
  })
  await page.route('**/hotkey/matrix*', async (route) => {
    const headers = { ...route.request().headers(), 'user-agent': 'Unknown', 'sec-ch-ua-platform': '"Unknown"' }
    await route.fulfill({ response: await route.fetch({ headers }) })
  })
  const hint = page.getByTestId('mod-k-enabled-auto')

  if (javaScriptEnabled) {
    await openFixture(page, 'hotkey/matrix')
    await expect(keycaps(hint).first()).toHaveText('⌘')
  } else {
    await page.goto('/hotkey/matrix')
    await expect(keycaps(hint).first()).toHaveText('Ctrl')
  }

  const box = await hint.boundingBox()
  await context.close()
  return box!.width
}

async function modKey(page: Page): Promise<'Meta' | 'Control'> {
  const name = await page.getByTestId('live').getAttribute('aria-label')
  return name?.startsWith('Command') ? 'Meta' : 'Control'
}

async function pressSearch(page: Page) {
  await page.keyboard.press(`${await modKey(page)}+k`)
}

test.describe('MHotkey', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'hotkey/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'hotkey/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'hotkey/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('pressing the registered combination runs its handler', async ({ page }) => {
    await openFixture(page, 'hotkey/matrix')

    await pressSearch(page)

    await expect(page.getByTestId('activations')).toHaveText('1')
  })

  test('the combination typed into a field is left to the field', async ({ page }) => {
    await openFixture(page, 'hotkey/matrix')
    const field = page.getByTestId('field')

    await field.focus()
    await pressSearch(page)
    await page.keyboard.type('k')

    await expect(page.getByTestId('activations')).toHaveText('0')
    await expect(field).toHaveValue('k')
  })

  test('every spelling of the up arrow draws the same glyph and name', async ({ page }) => {
    await openFixture(page, 'hotkey/matrix')

    for (const spelling of ['arrowup', 'ArrowUp', 'up', 'UP', 'arrow-up']) {
      const hint = page.getByTestId(`spelling-${spelling}`)
      await expect(keycaps(hint).last(), spelling).toHaveText('↑')
      await expect(hint, spelling).toHaveAccessibleName('Alt Up')
    }
  })

  test('a disabled hint is announced as unavailable', async ({ page }) => {
    await openFixture(page, 'hotkey/matrix')
    const hint = page.getByTestId('mod-k-disabled-windows')

    await expect(hint).toHaveAttribute('aria-disabled', 'true')
    await expect(hint).toHaveAccessibleName('Control K, unavailable')
    await expect(page.getByTestId('mod-k-enabled-windows')).not.toHaveAttribute('aria-disabled', 'true')
  })

  test('holding the keys tints the keycap without moving it', async ({ page }) => {
    await openFixture(page, 'hotkey/matrix')
    const modifier = keycaps(page.getByTestId('live')).first()
    const key = await modKey(page)
    const before = await modifier.boundingBox()

    await page.keyboard.down(key)
    await expect(modifier).toHaveClass(/ui-hotkey__key--pressed/)
    const during = await modifier.boundingBox()
    const transform = await style(modifier, 'transform')
    await page.keyboard.up(key)

    expect(during).toEqual(before)
    expect(transform).toBe('none')
    await expect(modifier).not.toHaveClass(/ui-hotkey__key--pressed/)
  })

  test('keycaps keep a boundary and their states in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'hotkey/matrix')
    const enabled = keycaps(page.getByTestId('mod-k-enabled-windows')).first()
    const disabled = keycaps(page.getByTestId('mod-k-disabled-windows')).first()
    const live = keycaps(page.getByTestId('live')).first()

    expect(await style(enabled, 'border-top-style')).not.toBe('none')
    expect(await style(disabled, 'color')).not.toBe(await style(enabled, 'color'))

    const key = await modKey(page)
    const idle = await style(live, 'background-color')
    await page.keyboard.down(key)
    await expect(live).toHaveClass(/ui-hotkey__key--pressed/)
    const pressed = await style(live, 'background-color')
    await page.keyboard.up(key)

    expect(pressed).not.toBe(idle)
  })

  test('the server draws the mac form when the request names macOS', async ({ request }) => {
    const response = await request.get('/hotkey/matrix', {
      headers: { 'sec-ch-ua-platform': '"macOS"', 'user-agent': MAC_UA },
    })
    const tag = openingTag(await response.text(), 'mod-k-enabled-auto')

    expect(tag).toContain('aria-label="Command K"')
  })

  test('the server falls back to the wide form when the platform is unknown', async ({ request }) => {
    const response = await request.get('/hotkey/matrix', {
      headers: { 'user-agent': 'Unknown' },
    })
    const tag = openingTag(await response.text(), 'mod-k-enabled-auto')

    expect(tag).toContain('aria-label="Control K"')
  })

  test('a mac hint keeps the server width after hydration', async ({ browser, baseURL }) => {
    const serverWidth = await hintWidthWithUnknownServerPlatform(browser, baseURL, false)
    const hydratedWidth = await hintWidthWithUnknownServerPlatform(browser, baseURL, true)

    expect(hydratedWidth).toBeCloseTo(serverWidth, 0)
  })
})
