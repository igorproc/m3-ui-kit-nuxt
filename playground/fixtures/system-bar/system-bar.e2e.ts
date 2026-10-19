import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const BAR_HEIGHT_REM = 24
const ICON_SIZE_REM = 16

const remPx = (page: Page) => page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))
const box = async (locator: Locator) => (await locator.boundingBox())!

const scaleRootFont = (page: Page, factor: number) => page.evaluate((scale) => {
  const root = document.documentElement
  root.style.fontSize = `${Number.parseFloat(getComputedStyle(root).fontSize) * scale}px`
}, factor)

test.describe('MSystemBar', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'system-bar/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'system-bar/stress')
    await expectNoAxeViolations(page)
  })

  test('the bar inside a layout has no axe violations', async ({ page }) => {
    await openFixture(page, 'system-bar/layout')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'system-bar/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  for (const id of ['long-text', 'long-word']) {
    test(`${id} stays on one line with an ellipsis at 360px`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 800 })
      await openFixture(page, 'system-bar/stress')
      const bar = page.getByTestId(id)
      const text = bar.locator('.ui-system-bar__text')
      const rem = await remPx(page)

      const metrics = await text.evaluate(el => ({
        overflow: getComputedStyle(el).textOverflow,
        lineHeight: Number.parseFloat(getComputedStyle(el).lineHeight),
        height: el.getBoundingClientRect().height,
        truncated: el.scrollWidth > el.clientWidth,
      }))

      expect(metrics.overflow).toBe('ellipsis')
      expect(metrics.truncated).toBe(true)
      expect(metrics.height).toBeCloseTo(metrics.lineHeight, 0)
      expect((await box(bar)).height).toBeCloseTo(BAR_HEIGHT_REM * rem, 0)
    })
  }

  test('icons in prepend and append are 16 without a selector on the icon', async ({ page }) => {
    await openFixture(page, 'system-bar/matrix')
    const rem = await remPx(page)
    const bar = page.getByTestId('full')

    for (const part of ['prepend', 'append']) {
      const icon = bar.locator(`.ui-system-bar__${part} .ui-icon`).first()
      const size = await icon.evaluate(el => Number.parseFloat(getComputedStyle(el).fontSize))
      expect(size, part).toBeCloseTo(ICON_SIZE_REM * rem, 0)
    }
  })

  test('in RTL the append cluster sits at the left end', async ({ page }) => {
    await openFixture(page, 'system-bar/matrix', { dir: 'rtl' })
    const bar = page.getByTestId('text-append')

    const append = await box(bar.locator('.ui-system-bar__append'))
    const text = await box(bar.locator('.ui-system-bar__text'))

    expect(append.x).toBeLessThan(text.x)
  })

  test('the bar keeps a visible lower edge in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'system-bar/matrix')

    const style = await page.getByTestId('text').evaluate(el => getComputedStyle(el).borderBlockEndStyle)
    expect(style).not.toBe('none')
  })

  for (const width of [360, 1366]) {
    for (const scale of [1, 2]) {
      test(`the pinned bar does not run into the app bar at ${scale * 100}% font size, ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        await openFixture(page, 'system-bar/layout')
        await scaleRootFont(page, scale)

        const bar = page.getByTestId('layout-system-bar')
        const appBar = page.getByTestId('layout-app-bar')
        const barBox = await box(bar)
        const appBarBox = await box(appBar)

        expect(barBox.y + barBox.height).toBeLessThanOrEqual(appBarBox.y + 0.5)

        const text = await bar.locator('.ui-system-bar__text').evaluate(el => ({
          clippedVertically: el.scrollHeight > el.clientHeight,
          lineHeight: Number.parseFloat(getComputedStyle(el).lineHeight),
          height: el.getBoundingClientRect().height,
        }))

        expect(text.clippedVertically).toBe(false)
        expect(text.height).toBeCloseTo(text.lineHeight, 0)
      })
    }
  }
})
