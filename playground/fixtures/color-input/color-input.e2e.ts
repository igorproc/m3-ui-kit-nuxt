import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

/** `data-test` falls through to the field's input; the field root is its ancestor. */
const root = (input: Locator) => input.locator('xpath=ancestor::div[contains(@class, "ui-text-field ")][1]')

test.describe('MColorInput', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'color-input/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'color-input/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'color-input/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('an unreadable value says which forms it takes', async ({ page }) => {
    await openFixture(page, 'color-input/matrix')
    const input = page.getByTestId('value-filled')

    await input.fill('nonsense')
    await input.press('Enter')

    await expect(root(input).getByRole('alert')).toHaveText('Use #RRGGBB, rgb() or hsl()')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
  })

  test('required and the field axes reach the input', async ({ page }) => {
    await openFixture(page, 'color-input/matrix')

    await expect(page.getByTestId('required-outlined')).toHaveAttribute('aria-required', 'true')
  })

  test('the picker takes its own arrow keys, and Escape returns focus to the swatch button', async ({ page }) => {
    await openFixture(page, 'color-input/matrix')
    const input = page.getByTestId('value-filled')
    const trigger = root(input).getByRole('button', { name: 'Pick a colour' })

    await trigger.click()
    const hue = page.getByRole('slider', { name: 'Hue' })
    await hue.focus()
    const before = await hue.inputValue()
    await page.keyboard.press('ArrowRight')
    expect(await hue.inputValue()).not.toBe(before)

    await page.keyboard.press('Escape')
    await expect(trigger).toBeFocused()
  })

  test('read-only and disabled fields do not open the picker', async ({ page }) => {
    await openFixture(page, 'color-input/matrix')

    for (const id of ['readonly-filled', 'disabled-filled']) {
      await expect(root(page.getByTestId(id)).getByRole('button', { name: 'Pick a colour' })).toBeDisabled()
    }
  })

  test('forced colors: the swatch keeps an edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'color-input/matrix')
    const swatch = root(page.getByTestId('value-filled')).locator('.ui-color-input__swatch')

    expect(await swatch.evaluate(el => getComputedStyle(el).borderTopStyle)).toBe('solid')
  })
})
