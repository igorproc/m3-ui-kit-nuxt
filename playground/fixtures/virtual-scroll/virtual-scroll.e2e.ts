import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const MAX_RENDERED = 100

const scrollToEnd = (viewport: Locator) => viewport.evaluate((el) => {
  el.scrollTop = el.scrollHeight
  el.scrollLeft = getComputedStyle(el).direction === 'rtl' ? -el.scrollWidth : el.scrollWidth
})

const box = async (locator: Locator) => (await locator.boundingBox())!

test.describe('useVirtualScroll', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'virtual-scroll/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }

    test(`stress has no axe violations (${theme})`, async ({ page }) => {
      await openFixture(page, 'virtual-scroll/stress', { theme })
      await expectNoAxeViolations(page)
    })
  }

  for (const width of WIDTHS) {
    for (const fixture of ['matrix', 'stress']) {
      test(`${fixture} does not overflow the page at ${width}px`, async ({ page }) => {
        await page.setViewportSize({ width, height: 800 })
        await openFixture(page, `virtual-scroll/${fixture}`)
        await expectNoHorizontalOverflow(page)
      })
    }
  }

  test('keeps a bounded number of rows in the DOM for 100 000 items', async ({ page }) => {
    await openFixture(page, 'virtual-scroll/stress')
    const items = page.getByTestId('stress-item')

    const rendered = await items.count()
    expect(rendered).toBeGreaterThan(0)
    expect(rendered).toBeLessThan(MAX_RENDERED)
    await expect(page.getByTestId('rendered')).toHaveText(String(rendered))
    await expect(items.first()).toHaveAttribute('aria-setsize', '100000')
  })

  test('programmatic navigation to the end reports isAtEnd and keeps the DOM bounded', async ({ page }) => {
    await openFixture(page, 'virtual-scroll/stress')

    await page.getByTestId('to-end').click()

    await expect(page.getByTestId('reached')).toHaveText('true')
    await expect(page.getByTestId('at-end')).toHaveText('true')
    await expect(page.getByTestId('at-start')).toHaveText('false')
    await expect(page.getByText('Row 100000', { exact: true })).toBeInViewport()
    expect(await page.getByTestId('stress-item').count()).toBeLessThan(MAX_RENDERED)
    await expect(page.getByTestId('state')).toHaveText('idle')
  })

  test('programmatic navigation centres a row in the middle', async ({ page }) => {
    await openFixture(page, 'virtual-scroll/stress')

    await page.getByTestId('to-middle').click()

    await expect(page.getByTestId('reached')).toHaveText('true')
    await expect(page.getByText('Row 50000', { exact: true })).toBeInViewport()
    await expect(page.getByTestId('at-start')).toHaveText('false')
    await expect(page.getByTestId('at-end')).toHaveText('false')
  })

  test('End on the focused region scrolls natively and reaches isAtEnd', async ({ page }) => {
    await openFixture(page, 'virtual-scroll/stress')

    await page.getByTestId('stress').focus()
    await page.keyboard.press('End')

    await expect(page.getByTestId('at-end')).toHaveText('true')
    await expect(page.getByText('Row 100000', { exact: true })).toBeInViewport()
    await expect(page.getByTestId('state')).toHaveText('idle')
  })

  test('an empty collection renders no rows and sits at both edges', async ({ page }) => {
    await openFixture(page, 'virtual-scroll/stress')

    await expect(page.getByTestId('empty').getByRole('listitem')).toHaveCount(0)
    await expect(page.getByTestId('empty-at-end')).toHaveText('At end: true')
  })

  test('scrolling a vertical pane to the bottom flips its boundaries', async ({ page }) => {
    await openFixture(page, 'virtual-scroll/matrix')

    for (const pane of ['vertical-constant', 'vertical-known']) {
      await expect(page.getByTestId(`${pane}-at-end`)).toHaveText('false')
      await scrollToEnd(page.getByTestId(pane))
      await expect(page.getByTestId(`${pane}-at-end`), pane).toHaveText('true')
      await expect(page.getByTestId(`${pane}-at-start`), pane).toHaveText('false')
      await expect(page.getByTestId(`${pane}-range`), pane).toHaveText(/–999\s*$/)
    }
  })

  for (const dir of DIRECTIONS) {
    test(`horizontal panes start at the inline start and reach the end (${dir})`, async ({ page }) => {
      await openFixture(page, 'virtual-scroll/matrix', { dir })

      for (const [pane, paddingStart] of [['horizontal-constant', 0], ['horizontal-known', 8]] as const) {
        const viewport = page.getByTestId(pane)
        const first = await box(page.getByTestId(`${pane}-item`).first())
        const frame = await box(viewport)
        const startEdge = dir === 'rtl' ? frame.x + frame.width - (first.x + first.width) : first.x - frame.x

        expect(Math.abs(startEdge - paddingStart), pane).toBeLessThanOrEqual(1)
        await expect(page.getByTestId(`${pane}-at-start`), pane).toHaveText('true')

        await scrollToEnd(viewport)

        await expect(page.getByTestId(`${pane}-at-end`), pane).toHaveText('true')
        await expect(page.getByTestId(`${pane}-at-start`), pane).toHaveText('false')
        await expect(viewport.getByText('Card 1000', { exact: true }), pane).toBeInViewport()
      }
    })
  }
})
