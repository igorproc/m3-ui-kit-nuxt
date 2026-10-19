import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'
import { drawnRadii, traceCorner } from '../button/motion'

const radius = (locator: Locator) => locator.evaluate(el => getComputedStyle(el).borderTopRightRadius)

test.describe('MButtonGroup', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'button-group/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'button-group/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'button-group/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('single choice is one Tab stop on the checked button', async ({ page }) => {
    await openFixture(page, 'button-group/matrix')
    const group = page.getByTestId('group-filled')

    await expect(group).toHaveAttribute('role', 'radiogroup')
    await expect(group.getByRole('radio', { name: 'Week' })).toHaveAttribute('tabindex', '0')
    await expect(group.getByRole('radio', { name: 'Day' })).toHaveAttribute('tabindex', '-1')
  })

  test('arrows move the selection past disabled buttons; Home and End jump', async ({ page }) => {
    await openFixture(page, 'button-group/matrix')
    const group = page.getByTestId('group-filled')

    await group.getByRole('radio', { name: 'Week' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(group.getByRole('radio', { name: 'Year' })).toBeFocused()
    await expect(group.getByRole('radio', { name: 'Year' })).toHaveAttribute('aria-checked', 'true')

    await page.keyboard.press('Home')
    await expect(group.getByRole('radio', { name: 'Day' })).toHaveAttribute('aria-checked', 'true')
    await page.keyboard.press('End')
    await expect(group.getByRole('radio', { name: 'Year' })).toHaveAttribute('aria-checked', 'true')
  })

  test('in RTL the left arrow moves forward', async ({ page }) => {
    await openFixture(page, 'button-group/matrix', { dir: 'rtl' })
    const group = page.getByTestId('group-filled')

    await group.getByRole('radio', { name: 'Day' }).click()
    await page.keyboard.press('ArrowLeft')
    await expect(group.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true')
  })

  test('multiple choice toggles aria-pressed with Space', async ({ page }) => {
    await openFixture(page, 'button-group/matrix')
    const unread = page.getByTestId('group-multiple').getByRole('button', { name: 'Unread' })

    await unread.focus()
    await page.keyboard.press('Space')
    await expect(unread).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByTestId('filters')).toHaveText('starred,unread')
  })

  test('the selected button is a pill; the rest meet with small inner corners', async ({ page }) => {
    await openFixture(page, 'button-group/matrix')
    const group = page.getByTestId('group-filled')
    const day = group.getByRole('radio', { name: 'Day' })
    const week = group.getByRole('radio', { name: 'Week' })

    const inner = await radius(day)
    expect(Number.parseFloat(await radius(week))).toBeGreaterThan(Number.parseFloat(inner))

    // Pressing changes neither the corners nor the width: no Expressive morph.
    const width = (await day.boundingBox())!.width
    await day.hover()
    await page.mouse.down()
    expect(await radius(day)).toBe(inner)
    expect((await day.boundingBox())!.width).toBeCloseTo(width, 0)
    await page.mouse.up()
  })

  // Q-1: a 999rem end beside an 8 corner scaled the corner set down until the 8
  // drew as 0.16; the ends and the pill are now the step's half height.
  test('ends, inner corners and the pill are drawn at their sizes on every step', async ({ page }) => {
    await openFixture(page, 'button-group/matrix')

    const filled = page.getByTestId('group-filled')
    const day = await drawnRadii(filled.getByRole('radio', { name: 'Day' }))
    const week = await drawnRadii(filled.getByRole('radio', { name: 'Week' }))
    const year = await drawnRadii(filled.getByRole('radio', { name: 'Year' }))
    expect(day.tl).toBeCloseTo(20, 0)
    expect(day.tr).toBeCloseTo(8, 0)
    expect(week.tl).toBeCloseTo(20, 0)
    expect(week.tr).toBeCloseTo(20, 0)
    expect(year.tl).toBeCloseTo(8, 0)
    expect(year.br).toBeCloseTo(20, 0)

    for (const [density, half] of [['compact', 16], ['comfortable', 28]] as const) {
      const last = await drawnRadii(page.getByTestId(`group-density-${density}`).getByRole('radio', { name: 'Year' }))
      expect(last.tl, density).toBeCloseTo(8, 0)
      expect(last.tr, density).toBeCloseTo(half, 0)
    }
  })

  test('a newly selected button grows into its pill frame by frame', async ({ page }) => {
    await openFixture(page, 'button-group/matrix')
    const day = page.getByTestId('group-filled').getByRole('radio', { name: 'Day' })

    const motion = await traceCorner(page, '[data-test="group-filled"] .ui-button:nth-child(1)', () => day.click(), 'tr')
    expect(motion.toRem - motion.fromRem).toBeGreaterThan(10)
    expect(motion.lagMs!).toBeLessThanOrEqual(34)
    expect(motion.largestStepShare).toBeLessThan(0.5)
  })

  test('a selected label stays readable in forced colors', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'button-group/matrix')
    const week = page.getByTestId('group-tonal').getByRole('radio', { name: 'Week' })

    expect(await week.evaluate(el => getComputedStyle(el).forcedColorAdjust)).toBe('none')
  })

  test('buttons are 2 apart', async ({ page }) => {
    await openFixture(page, 'button-group/matrix')
    const rem = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.documentElement).fontSize))
    const buttons = page.getByTestId('group-outlined').locator('button')

    const first = (await buttons.nth(0).boundingBox())!
    const second = (await buttons.nth(1).boundingBox())!
    expect((second.x - (first.x + first.width)) / rem).toBeCloseTo(2, 0)
  })

  test('the selected button stays distinct in forced-colors mode', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'button-group/matrix')
    const group = page.getByTestId('group-tonal')
    const background = (name: string) => group.getByRole('radio', { name }).evaluate(el => getComputedStyle(el).backgroundColor)

    expect(await background('Week')).not.toBe(await background('Day'))
  })
})
