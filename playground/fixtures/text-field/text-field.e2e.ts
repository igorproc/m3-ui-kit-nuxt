import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const VARIANTS = ['filled', 'outlined', 'underline'] as const

/** `data-test` falls through to the native input; the field's root is its ancestor. */
const root = (input: Locator) => input.locator('xpath=ancestor::div[contains(@class, "ui-text-field ")][1]')

/** The element that draws the field's edge: the outline for outlined, the control otherwise. */
async function edge(input: Locator, variant: string) {
  const selector = variant === 'outlined' ? '.ui-text-field__outline' : '.ui-text-field__control'
  return root(input).locator(selector).evaluate(el => getComputedStyle(el).borderBottomColor)
}

test.describe('MTextField', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'text-field/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'text-field/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'text-field/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('Tab reaches enabled, read-only and invalid fields and skips disabled ones', async ({ page }) => {
    await openFixture(page, 'text-field/matrix')

    const reached: string[] = []
    for (let step = 0; step < 60; step++) {
      await page.keyboard.press('Tab')
      const id = await page.evaluate(() => document.activeElement?.getAttribute('data-test') ?? '')
      if (reached.includes(id)) break
      if (id) reached.push(id)
    }

    for (const variant of VARIANTS) {
      expect(reached).toContain(`enabled-${variant}`)
      expect(reached).toContain(`readonly-${variant}`)
      expect(reached).toContain(`error-${variant}`)
      expect(reached).not.toContain(`disabled-${variant}`)
    }
  })

  for (const variant of VARIANTS) {
    test(`focus changes the ${variant} edge, also in error and read-only`, async ({ page }) => {
      await openFixture(page, 'text-field/matrix')

      for (const state of ['enabled', 'error', 'readonly']) {
        const input = page.getByTestId(`${state}-${variant}`)
        const resting = await edge(input, variant)
        await input.focus()
        await expect.poll(() => edge(input, variant), `${state}-${variant}`).not.toBe(resting)
        await input.blur()
      }
    })
  }

  test('a filled field in error or disabled colours only its bottom edge', async ({ page }) => {
    await openFixture(page, 'text-field/matrix')

    for (const state of ['error', 'disabled']) {
      const sides = await root(page.getByTestId(`${state}-filled`)).locator('.ui-text-field__control')
        .evaluate((el) => {
          const style = getComputedStyle(el)
          return [style.borderTopColor, style.borderLeftColor, style.borderRightColor]
        })

      expect(sides, state).toEqual(['rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)'])
    }
  })

  test('the support line is reserved: an error does not change the field height', async ({ page }) => {
    await openFixture(page, 'text-field/matrix')

    for (const variant of VARIANTS) {
      const enabled = await root(page.getByTestId(`enabled-${variant}`)).boundingBox()
      const invalid = await root(page.getByTestId(`error-${variant}`)).boundingBox()

      expect(invalid!.height, variant).toBeCloseTo(enabled!.height, 0)
    }
  })

  test('an error without a message still shows a glyph, not colour alone', async ({ page }) => {
    await openFixture(page, 'text-field/matrix')

    await expect(root(page.getByTestId('flagged-filled')).locator('.ui-text-field__support-icon')).toBeVisible()
  })

  test('the alert region exists before the error and receives it', async ({ page }) => {
    await openFixture(page, 'text-field/stress')
    const field = root(page.getByTestId('toggle-field'))
    const region = field.locator('[role="alert"]')
    const fieldHeight = (await field.boundingBox())!.height

    await expect(region).toHaveCount(1)
    await expect(region).toHaveText('')

    await page.getByTestId('toggle-error').click()

    await expect(region).toHaveText('That name is taken')
    await expect(page.getByTestId('toggle-field')).toHaveAttribute('aria-invalid', 'true')
    expect((await field.boundingBox())!.height).toBeCloseTo(fieldHeight, 0)
  })

  test('a numeric 0 raises the floating label off the value', async ({ page }) => {
    await openFixture(page, 'text-field/stress')

    await expect(root(page.getByTestId('zero'))).toHaveClass(/ui-text-field--populated/)
  })

  test('a long word in the support line wraps inside the field', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'text-field/stress')

    for (const id of ['long-word-helper', 'long-word-error']) {
      const support = root(page.getByTestId(id)).locator('.ui-text-field__support')
      const overflow = await support.evaluate(el => el.scrollWidth - el.clientWidth)
      expect(overflow, id).toBeLessThanOrEqual(0)
    }
  })

  test('in RTL the overlaid label starts at the right edge', async ({ page }) => {
    await openFixture(page, 'text-field/matrix', { dir: 'rtl' })
    const field = root(page.getByTestId('enabled-outlined'))

    const control = (await field.locator('.ui-text-field__control').boundingBox())!
    const label = (await field.locator('.ui-text-field__label').boundingBox())!

    expect(control.x + control.width - (label.x + label.width)).toBeLessThan(control.width / 4)
  })

  test('forced colors: focus is Highlight and error is a dashed edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'text-field/matrix')

    const errorStyle = await root(page.getByTestId('error-filled')).locator('.ui-text-field__control')
      .evaluate(el => getComputedStyle(el).borderBottomStyle)
    expect(errorStyle).toBe('dashed')

    const input = page.getByTestId('enabled-outlined')
    const resting = await edge(input, 'outlined')
    await input.focus()
    await expect.poll(() => edge(input, 'outlined')).not.toBe(resting)
  })
})
