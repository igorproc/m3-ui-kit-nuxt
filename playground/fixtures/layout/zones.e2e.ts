import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { openFixture, remInPx } from '../../e2e/support'

const box = async (locator: Locator) => (await locator.boundingBox())!
const style = (locator: Locator, property: string) =>
  locator.evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property)

/** Scrolls the document so the element's top edge ends `offset` px above the window's top. */
const scrollPast = (locator: Locator, offset: number) =>
  locator.evaluate((el, by) => window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top + by), offset)

/** The `<main>` tags of `m-layout-main` exactly as the server rendered them, before hydration. */
async function serverMainTags(page: Page, key: string) {
  const html = await (await page.request.get(`/${key}`)).text()
  return html.match(/<main[^>]*class="m-layout-main[^"]*"[^>]*>/g) ?? []
}

test.describe('MLayout zones (page scroll)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 })
  })

  test('a small bar keeps the height its zone reserves with a 56rem control inside', async ({ page }) => {
    await openFixture(page, 'layout/matrix')
    const rem = await remInPx(page)

    expect((await box(page.getByTestId('tall-control'))).height).toBeCloseTo(56 * rem, 0)
    expect((await box(page.getByTestId('app-bar'))).height).toBeCloseTo(64 * rem, 0)
    expect((await box(page.getByTestId('header'))).height).toBeCloseTo(64 * rem, 0)
  })

  test('main is no scroller, so a sticky element inside it sticks below the pinned header', async ({ page }) => {
    await openFixture(page, 'layout/matrix')
    const main = page.getByTestId('main')

    expect(await style(main, 'overflow-y')).toBe('visible')
    expect(await style(main, 'overflow-x')).toBe('clip')

    await scrollPast(page.getByTestId('sticky-section'), 100)
    const header = await box(page.getByTestId('header'))

    expect((await box(page.getByTestId('sticky-note'))).y).toBeCloseTo(header.y + header.height, 0)
  })

  test('main is a size container only with the container prop', async ({ page }) => {
    await openFixture(page, 'layout/matrix')
    const main = page.getByTestId('main')

    expect(await style(main, 'container-type')).toBe('inline-size')
    expect(await style(main, 'container-name')).toBe('main-content')

    await openFixture(page, 'layout/full-height')
    expect(await style(page.getByTestId('main'), 'container-type')).toBe('normal')
  })

  test('a nested layout stays in its pane: in-flow header, content height', async ({ page }) => {
    await openFixture(page, 'layout/matrix')
    const nested = page.getByTestId('nested')
    const header = page.getByTestId('nested-header')

    expect(await style(header, 'position')).not.toBe('fixed')
    expect((await box(nested)).height).toBeLessThan(800 / 2)

    await nested.evaluate(el => el.scrollIntoView({ block: 'center' }))

    expect(Math.abs((await box(header)).y - (await box(nested)).y)).toBeLessThan(1)
  })

  test('a snackbar at the first level of the layout raises no unregistered-element warning', async ({ page }) => {
    const warnings: string[] = []
    page.on('console', (message) => {
      if (message.type() === 'warning') warnings.push(message.text())
    })

    await openFixture(page, 'layout/matrix')

    expect(warnings.filter(text => text.includes('Unregistered element'))).toEqual([])
  })
})

test.describe('MLayout zones (full height)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 })
  })

  test('a pinned zone fills the row it reserves when its content is shorter', async ({ page }) => {
    await openFixture(page, 'layout/full-height')
    const rem = await remInPx(page)
    const band = page.getByTestId('band')

    expect(await style(band, 'position')).toBe('fixed')
    expect((await box(band)).height).toBeCloseTo(48 * rem, 0)
  })

  test('a fixed element inside main stays put while main scrolls', async ({ page }) => {
    await openFixture(page, 'layout/full-height')
    const rem = await remInPx(page)
    const main = page.getByTestId('main')
    const fixed = page.getByTestId('fixed-box')
    const before = await box(fixed)

    await main.evaluate((el) => {
      el.scrollTop = 600
    })

    expect(await main.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
    expect((await box(fixed)).y).toBeCloseTo(before.y, 0)
    expect(before.y + before.height).toBeCloseTo(800 - 120 * rem, 0)
  })

  // A rail that is page content of the scrolling main used to stick the height
  // of the header below main's top and run past its bottom.
  test('a rail inside the scrolling main sticks to its top and spans its height', async ({ page }) => {
    await page.goto('/layout/full-height?theme=light&dir=ltr&rail=main')
    await page.locator('[data-fixture-ready]').waitFor()
    const main = page.getByTestId('main')
    const rail = page.getByTestId('rail-in-main')

    await main.evaluate((el) => {
      el.scrollTop = 600
    })
    const [mainBox, railBox] = [await box(main), await box(rail)]
    const visibleHeight = await main.evaluate(el => el.clientHeight)

    expect(await main.evaluate(el => el.scrollTop)).toBeGreaterThan(0)
    expect(railBox.y).toBeCloseTo(mainBox.y, 0)
    // clientHeight is rounded to a whole pixel
    expect(Math.abs(railBox.height - visibleHeight)).toBeLessThanOrEqual(1)
  })

  test('only the scrolling main is a tab stop, already in the server HTML', async ({ page }) => {
    const [shell] = await serverMainTags(page, 'layout/full-height')
    const [pageScroll] = await serverMainTags(page, 'layout/matrix')

    expect(shell).toContain('m-layout-main--scroll')
    expect(shell).toContain('tabindex="0"')
    expect(pageScroll).not.toContain('tabindex')
  })

  test('the keyboard reaches the scrolling main and shows an inset focus ring', async ({ page }) => {
    await openFixture(page, 'layout/full-height')
    const main = page.getByTestId('main')

    for (let step = 0; step < 6 && !(await main.evaluate(el => el === document.activeElement)); step++) {
      await page.keyboard.press('Tab')
    }

    await expect(main).toBeFocused()
    expect(await style(main, 'outline-style')).not.toBe('none')
    expect(Number.parseFloat(await style(main, 'outline-width'))).toBeGreaterThan(0)
    expect(Number.parseFloat(await style(main, 'outline-offset'))).toBeLessThan(0)
  })
})

test.describe('MAppBar outside a layout', () => {
  test('sticks only while sticky is on', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 })
    await openFixture(page, 'layout/stress')
    const sticky = page.getByTestId('bar-sticky')
    const still = page.getByTestId('bar-static')

    expect(await style(sticky, 'position')).toBe('sticky')
    expect(await style(still, 'position')).toBe('static')

    await scrollPast(page.getByTestId('bars'), 200)

    expect((await box(sticky)).y).toBeCloseTo(0, 0)
    expect((await box(still)).y).toBeLessThan(0)
  })

  test('a heading level changes the element, not the look of the title', async ({ page }) => {
    await openFixture(page, 'layout/stress')
    const heading = page.getByTestId('bar-sticky').locator('.ui-app-bar__title')
    const paragraph = page.getByTestId('bar-static').locator('.ui-app-bar__title')

    expect(await heading.evaluate(el => el.tagName)).toBe('H3')
    expect(await paragraph.evaluate(el => el.tagName)).toBe('P')
    for (const property of ['font-size', 'font-weight', 'line-height', 'margin-top']) {
      expect(await style(heading, property)).toBe(await style(paragraph, property))
    }
  })
})
