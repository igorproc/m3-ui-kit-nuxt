import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const rem = (page: Page) => page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))
const box = async (locator: Locator) => (await locator.boundingBox())!
const style = (locator: Locator, property: string) =>
  locator.evaluate((el, name) => getComputedStyle(el).getPropertyValue(name), property)

/** Expected gap from the frame's edge at the start and at the end of the line, in rem. */
const INSETS = { none: [0, 0], start: [16, 0], center: [16, 16], end: [0, 16] } as const

test.describe('MDivider', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'divider/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'divider/stress')
    await expectNoAxeViolations(page)
  })

  test('a list with dividers keeps a valid list structure', async ({ page }) => {
    await openFixture(page, 'divider/stress')
    const { violations } = await new AxeBuilder({ page })
      .include('[data-test="list"]')
      .withRules(['list', 'listitem', 'aria-required-children', 'aria-required-parent', 'aria-hidden-focus'])
      .analyze()

    expect(violations.map(v => v.id)).toEqual([])
    await expect(page.getByTestId('list').getByRole('listitem')).toHaveCount(3)
    await expect(page.getByTestId('list').getByRole('separator')).toHaveCount(0)
  })

  test('outside a list it is a separator with an orientation', async ({ page }) => {
    await openFixture(page, 'divider/matrix')

    await expect(page.getByTestId('horizontal-none')).toHaveRole('separator')
    await expect(page.getByTestId('vertical-none')).toHaveAttribute('aria-orientation', 'vertical')
  })

  test('no inset pushes the line out of a narrow parent', async ({ page }) => {
    await openFixture(page, 'divider/stress')
    const narrow = page.getByTestId('narrow')

    expect(await narrow.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0)
    await expectNoHorizontalOverflow(page)
  })

  for (const dir of DIRECTIONS) {
    test(`a horizontal inset steps in on logical sides (${dir})`, async ({ page }) => {
      await openFixture(page, 'divider/matrix', { dir })
      const unit = await rem(page)

      for (const [name, [start, end]] of Object.entries(INSETS)) {
        const frame = await box(page.getByTestId(`frame-horizontal-${name}`))
        const line = await box(page.getByTestId(`horizontal-${name}`))
        const left = (line.x - frame.x) / unit
        const right = (frame.x + frame.width - line.x - line.width) / unit

        expect(dir === 'ltr' ? left : right, `${name} start`).toBeCloseTo(start, 0)
        expect(dir === 'ltr' ? right : left, `${name} end`).toBeCloseTo(end, 0)
      }
    })
  }

  test('a vertical line spans its row and insets along its own axis', async ({ page }) => {
    await openFixture(page, 'divider/matrix')
    const unit = await rem(page)

    for (const [name, [start, end]] of Object.entries(INSETS)) {
      const frame = await box(page.getByTestId(`frame-vertical-${name}`))
      const line = await box(page.getByTestId(`vertical-${name}`))

      expect((line.y - frame.y) / unit, `${name} top`).toBeCloseTo(start, 0)
      expect((frame.y + frame.height - line.y - line.height) / unit, `${name} bottom`).toBeCloseTo(end, 0)
      expect(line.width).toBeGreaterThanOrEqual(1)
    }
  })

  test('a vertical line outside a flex row stands one line tall', async ({ page }) => {
    await openFixture(page, 'divider/stress')

    for (const id of ['inline-divider', 'block-divider']) {
      const line = page.getByTestId(id)
      const lineHeight = Number.parseFloat(await style(line, 'line-height'))

      expect((await box(line)).height, id).toBeCloseTo(lineHeight, 0)
      expect((await box(line)).width, id).toBeGreaterThanOrEqual(1)
    }
  })

  test('the line never gets thinner than a pixel on a narrow screen', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'divider/matrix')

    expect(Number.parseFloat(await style(page.getByTestId('horizontal-none'), 'border-top-width'))).toBeGreaterThanOrEqual(1)
    expect((await box(page.getByTestId('vertical-none'))).width).toBeGreaterThanOrEqual(1)
  })

  test('forced colors: the line stays visible', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'divider/matrix')
    const line = page.getByTestId('horizontal-none')

    expect(await style(line, 'border-top-style')).toBe('solid')
    expect(Number.parseFloat(await style(line, 'border-top-width'))).toBeGreaterThanOrEqual(1)
    expect(await style(line, 'border-top-color')).not.toBe(await style(page.locator('body'), 'background-color'))
  })
})
