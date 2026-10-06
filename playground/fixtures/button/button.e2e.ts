import { expect, test } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const VARIANTS = ['elevated', 'filled', 'tonal', 'outlined', 'text']

test.describe('MButton', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'button/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'button/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'button/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('Tab reaches every enabled button and skips disabled and loading ones', async ({ page }) => {
    await openFixture(page, 'button/matrix')

    // Walk one full Tab cycle: stop at the first control seen twice.
    const reached: string[] = []
    for (let step = 0; step < 40; step++) {
      await page.keyboard.press('Tab')
      const id = await page.evaluate(() => document.activeElement?.getAttribute('data-test') ?? '')
      if (reached.includes(id)) break
      if (id) reached.push(id)
    }

    expect(reached.filter(id => id.startsWith('enabled-'))).toEqual(VARIANTS.map(v => `enabled-${v}`))
    expect(reached.some(id => id.startsWith('disabled-') || id.startsWith('loading-'))).toBe(false)
  })

  test('Enter and Space activate the focused button', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    const button = page.getByTestId('enabled-filled')
    const activations = page.getByTestId('activations')

    await button.focus()
    await page.keyboard.press('Enter')
    await expect(activations).toHaveText('1')
    await page.keyboard.press('Space')
    await expect(activations).toHaveText('2')
  })

  test('keyboard focus ring is at least 2px', async ({ page }) => {
    await openFixture(page, 'button/matrix')
    await page.keyboard.press('Tab')

    const width = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.activeElement!).outlineWidth))
    expect(width).toBeGreaterThanOrEqual(2)
  })

  test('buttons keep a visible boundary in forced-colors mode', async ({ page }) => {
    test.fail(true, 'Plan step C7: no forced-colors styles yet, filled/tonal/elevated buttons lose their edge')
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'button/matrix')

    for (const variant of VARIANTS) {
      const style = await page.getByTestId(`enabled-${variant}`).evaluate(el => getComputedStyle(el).borderStyle)
      expect(style, variant).not.toBe('none')
    }
  })
})
