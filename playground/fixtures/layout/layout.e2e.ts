import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const FIXTURES = ['layout/matrix', 'layout/full-height', 'layout/stress']

interface Cutouts {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

const box = async (locator: Locator) => (await locator.boundingBox())!
const remPx = (page: Page) => page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))
const px = (locator: Locator, property: string) =>
  locator.evaluate((el, name) => Number.parseFloat(getComputedStyle(el).getPropertyValue(name)), property)
const scrollPaddingTop = (page: Page) =>
  page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop))

const emulateCutouts = async (page: Page, insets: Cutouts) => {
  const session = await page.context().newCDPSession(page)
  await session.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, right: 0, bottom: 0, left: 0, ...insets } })
}

test.describe('MLayout', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'layout/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('full-height shell has no axe violations', async ({ page }) => {
    await openFixture(page, 'layout/full-height')
    await expectNoAxeViolations(page)
  })

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'layout/stress')
    await expectNoAxeViolations(page)
  })

  for (const fixture of FIXTURES) {
    for (const width of WIDTHS) {
      test(`${fixture} does not overflow the page at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        await openFixture(page, fixture)
        await expectNoHorizontalOverflow(page)
      })
    }
  }

  test('main content starts below the pinned header', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 })
    await openFixture(page, 'layout/matrix')

    const header = await box(page.getByTestId('header'))
    const firstSection = await box(page.getByTestId('section-1'))

    expect(firstSection.y).toBeGreaterThanOrEqual(header.y + header.height - 0.5)
  })

  test('Shift+Tab back to a control under the pinned header brings it below the header', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 })
    await openFixture(page, 'layout/matrix')
    const target = page.getByTestId('section-2-action')

    await page.getByTestId('section-3-action').focus()
    await target.evaluate((el) => {
      window.scrollTo(0, window.scrollY + el.getBoundingClientRect().top - 8)
    })
    await page.keyboard.press('Shift+Tab')

    await expect(target).toBeFocused()
    const header = await box(page.getByTestId('header'))
    expect((await box(target)).y).toBeGreaterThanOrEqual(header.y + header.height - 0.5)
  })

  test('scrolling a section into view keeps it clear of the pinned header', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 })
    await openFixture(page, 'layout/matrix')
    const section = page.getByTestId('section-4')

    await section.evaluate(el => el.scrollIntoView())

    const header = await box(page.getByTestId('header'))
    expect((await box(section)).y).toBeGreaterThanOrEqual(header.y + header.height - 0.5)
  })

  test('a nested layout lays its aside beside its main, not above it', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 })
    await openFixture(page, 'layout/matrix')

    const aside = await box(page.getByTestId('nested-aside'))
    const main = await box(page.getByTestId('nested-main'))

    expect(Math.abs(aside.y - main.y)).toBeLessThan(1)
    expect(aside.x + aside.width).toBeLessThanOrEqual(main.x + 0.5)
  })

  test('the document scroll padding equals the pinned header height', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 800 })
    await openFixture(page, 'layout/matrix')

    const header = await box(page.getByTestId('header'))

    expect(await scrollPaddingTop(page)).toBeCloseTo(header.height, 0)
  })

  test('main reserves its scrollbar gutter in full-height mode only', async ({ page }) => {
    const gutter = (locator: Locator) => locator.evaluate(el => getComputedStyle(el).getPropertyValue('scrollbar-gutter'))

    await openFixture(page, 'layout/full-height')
    expect(await gutter(page.getByTestId('main'))).toBe('stable')

    await openFixture(page, 'layout/matrix')
    expect(await gutter(page.getByTestId('main'))).toBe('auto')
  })

  test.describe('display cutouts', () => {
    test('a portrait top cutout moves the pinned bar content below it and joins the scroll padding', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await emulateCutouts(page, { top: 47 })
      await openFixture(page, 'layout/matrix')

      const header = await box(page.getByTestId('header'))
      const appBar = await box(page.getByTestId('app-bar'))
      const firstSection = await box(page.getByTestId('section-1'))

      expect(header.y).toBeCloseTo(0, 0)
      expect(appBar.y).toBeGreaterThanOrEqual(47 - 0.5)
      expect(header.height).toBeCloseTo(appBar.height + 47, 0)
      expect(firstSection.y).toBeGreaterThanOrEqual(header.y + header.height - 0.5)
      expect(await scrollPaddingTop(page)).toBeCloseTo(header.height, 0)
    })

    test('a bottom cutout keeps the pinned footer content above the home indicator', async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 })
      await emulateCutouts(page, { bottom: 34 })
      await openFixture(page, 'layout/full-height')

      const footer = await box(page.getByTestId('footer'))
      const text = await box(page.getByTestId('footer-text'))

      expect(footer.y + footer.height).toBeCloseTo(844, 0)
      expect(text.y + text.height).toBeLessThanOrEqual(844 - 34 + 0.5)
    })

    test('in landscape the full-width bar and the grid content clear the side cutouts', async ({ page }) => {
      await page.setViewportSize({ width: 844, height: 390 })
      await emulateCutouts(page, { left: 47, right: 47, bottom: 21 })
      await openFixture(page, 'layout/full-height')

      const appBar = page.getByTestId('app-bar')
      expect(await px(appBar, 'border-left-width')).toBeCloseTo(47, 0)
      expect(await px(appBar, 'border-right-width')).toBeCloseTo(47, 0)

      const container = page.locator('.m-container').first()
      expect(await px(container, 'padding-left')).toBeGreaterThanOrEqual(47 - 0.5)
      expect(await px(container, 'padding-right')).toBeGreaterThanOrEqual(47 - 0.5)
    })

    test('without a cutout the bars keep their own geometry', async ({ page }) => {
      await page.setViewportSize({ width: 1366, height: 800 })
      await openFixture(page, 'layout/full-height')
      const rem = await remPx(page)
      const appBar = page.getByTestId('app-bar')

      expect(await px(appBar, 'border-top-width')).toBe(0)
      expect(await px(appBar, 'padding-top')).toBeCloseTo(8 * rem, 0)
    })
  })
})

test.describe('MContainer', () => {
  for (const [width, margin] of [[360, 16], [768, 24], [1366, 24]] as const) {
    test(`side margin is ${margin} at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'layout/stress')
      const rem = await remPx(page)
      const grid = page.getByTestId('grid-default')

      expect(await px(grid, 'padding-left')).toBeCloseTo(margin * rem, 0)
      expect(await px(grid, 'padding-right')).toBeCloseTo(margin * rem, 0)
    })
  }

  for (const [width, columns] of [[360, 4], [768, 8], [1366, 12]] as const) {
    test(`default grid has ${columns} columns at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'layout/stress')

      const tracks = await page.getByTestId('grid-default').evaluate(el => getComputedStyle(el).gridTemplateColumns.split(' ').length)
      expect(tracks).toBe(columns)
    })
  }

  test('a long word wraps inside its track instead of widening it', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'layout/stress')

    const word = await box(page.getByTestId('long-word'))
    const text = await box(page.getByTestId('long-text'))

    expect(word.width).toBeCloseTo(text.width, 0)
  })
})

test.describe('MResponsive', () => {
  test('the focus ring of a child that fills the box is not clipped', async ({ page }) => {
    await openFixture(page, 'layout/stress')
    const responsive = page.getByTestId('responsive')
    const child = page.getByTestId('responsive-child')

    const outer = await box(responsive)
    const inner = await box(child)
    expect(inner.width).toBeCloseTo(outer.width, 0)
    expect(inner.height).toBeCloseTo(outer.height, 0)

    await child.focus()
    await page.keyboard.press('Shift+Tab')
    await page.keyboard.press('Tab')
    await expect(child).toBeFocused()

    const ring = await child.evaluate((el) => {
      const style = getComputedStyle(el)
      return Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset)
    })

    expect(ring).toBeGreaterThan(0)
    expect(await responsive.evaluate(el => getComputedStyle(el).overflow)).toBe('clip')
    expect(await px(responsive, 'overflow-clip-margin')).toBeGreaterThanOrEqual(ring - 0.5)
  })

  test('content taller than the ratio is clipped, the ratio holds', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'layout/stress')
    const responsive = page.getByTestId('responsive-overflow')

    const { width, height } = await box(responsive)
    const copy = await box(responsive.locator('p'))

    expect(copy.height).toBeGreaterThan(height)
    expect(height).toBeCloseTo(width, 0)
  })
})
