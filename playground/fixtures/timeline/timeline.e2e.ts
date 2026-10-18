import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const box = async (locator: Locator) => (await locator.boundingBox())!
const style = (locator: Locator, property: string, pseudo?: string) =>
  locator.evaluate((el, [name, part]) => getComputedStyle(el, part).getPropertyValue(name!), [property, pseudo] as const)
const columns = async (item: Locator) => (await style(item, 'grid-template-columns')).trim().split(/\s+/).length

test.describe('MTimeline', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'timeline/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'timeline/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await openFixture(page, 'timeline/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('is an ordered list of its events', async ({ page }) => {
    await openFixture(page, 'timeline/matrix')
    const timeline = page.getByTestId('side-end')

    await expect(timeline).toHaveRole('list')
    await expect(timeline.getByRole('listitem')).toHaveCount(4)
  })

  for (const id of ['side-end', 'side-start', 'line-dashed', 'density-compact', 'density-comfortable']) {
    test(`the rail runs without a seam from the first dot to the last (${id})`, async ({ page }) => {
      await openFixture(page, 'timeline/matrix')
      const items = page.getByTestId(id).locator(':scope > .ui-timeline-item')
      const count = await items.count()

      for (let index = 0; index < count; index++) {
        const item = items.nth(index)
        const before = await style(item, 'content', '::before')
        const after = await style(item, 'content', '::after')

        expect(before === 'none', `item ${index} line above`).toBe(index === 0)
        expect(after === 'none', `item ${index} line below`).toBe(index === count - 1)

        if (index < count - 1) {
          // The line below reaches the item's bottom, and the next item starts right there.
          expect(await style(item, 'bottom', '::after'), `item ${index}`).toBe('0px')
          const gap = (await box(items.nth(index + 1))).y - ((await box(item)).y + (await box(item)).height)
          expect(Math.abs(gap), `gap after item ${index}`).toBeLessThanOrEqual(1)
        }
      }
    })
  }

  test('line none draws no rail', async ({ page }) => {
    await openFixture(page, 'timeline/matrix')
    const items = page.getByTestId('line-none').locator(':scope > .ui-timeline-item')

    for (let index = 0; index < await items.count(); index++) {
      expect(await style(items.nth(index), 'content', '::before')).toBe('none')
      expect(await style(items.nth(index), 'content', '::after')).toBe('none')
    }
  })

  test('a one-sided timeline without times spends no column on them', async ({ page }) => {
    await openFixture(page, 'timeline/matrix')

    expect(await columns(page.getByTestId('density-default').locator(':scope > .ui-timeline-item').first())).toBe(2)
    expect(await columns(page.getByTestId('side-end').locator(':scope > .ui-timeline-item').first())).toBe(3)
  })

  test('one item with a time, or a side override, keeps the columns aligned', async ({ page }) => {
    await openFixture(page, 'timeline/stress')

    for (const id of ['mixed-time', 'override']) {
      const items = page.getByTestId(id).locator(':scope > .ui-timeline-item')
      expect(await columns(items.nth(0)), id).toBe(3)
      expect(await columns(items.nth(1)), id).toBe(3)

      const rails = [await box(items.nth(0).locator('.ui-timeline-item__divider')), await box(items.nth(1).locator('.ui-timeline-item__divider'))]
      expect(rails[0]!.x, id).toBeCloseTo(rails[1]!.x, 0)
    }
  })

  test('alternate collapses by the timeline\'s own width, not the window\'s', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 })
    await openFixture(page, 'timeline/stress')

    const narrow = page.getByTestId('narrow-alternate').locator(':scope > .ui-timeline-item')
    const wide = page.getByTestId('wide-alternate').locator(':scope > .ui-timeline-item')

    expect(await columns(narrow.first())).toBe(2)
    expect(await columns(wide.first())).toBe(3)

    // Collapsed, the time stacks over the content and the rail spans both.
    const time = await box(narrow.first().locator('.ui-timeline-item__opposite'))
    const content = await box(narrow.first().locator('.ui-timeline-item__content'))
    expect(content.y).toBeGreaterThanOrEqual(time.y + time.height - 1)
  })

  test('long unbroken values wrap inside their column', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 900 })
    await openFixture(page, 'timeline/stress')
    const item = page.getByTestId('long-item')

    for (const part of ['.ui-timeline-item__content', '.ui-timeline-item__opposite']) {
      const overflow = await item.locator(part).evaluate(el => el.scrollWidth - el.clientWidth)
      expect(overflow, part).toBeLessThanOrEqual(0)
    }
  })

  test('a status is read as a word, hidden from the eye', async ({ page }) => {
    await openFixture(page, 'timeline/matrix')
    const status = page.getByTestId('side-end').locator('.ui-timeline-item__status').first()

    await expect(status).toHaveText('Done')
    expect((await box(status)).width).toBeLessThanOrEqual(1)
    await expect(page.getByTestId('side-end').getByRole('listitem').nth(1)).toContainText('Done')
  })

  test('the marker stays out of the accessibility tree', async ({ page }) => {
    await openFixture(page, 'timeline/matrix')
    await expect(page.getByTestId('side-end').locator('.ui-timeline-divider').first()).toHaveAttribute('aria-hidden', 'true')
  })

  test('forced colors: the rail and the dots stay visible', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'timeline/matrix')
    const item = page.getByTestId('side-end').locator(':scope > .ui-timeline-item').first()
    const dot = item.locator('.ui-timeline-divider__dot')
    const canvas = await style(page.locator('body'), 'background-color')

    expect(await style(item, 'border-inline-start-style', '::after')).toBe('solid')
    expect(await style(item, 'border-inline-start-color', '::after')).not.toBe(canvas)
    expect(await style(dot, 'background-color')).not.toBe(canvas)
  })
})
