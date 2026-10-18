import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const picker = (page: Page, id: string) => page.locator(`[data-test="${id}"]`)

test.describe('MColorPicker', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'color-picker/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'color-picker/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await openFixture(page, 'color-picker/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('the swatch equal to the value is chosen, however either is spelled', async ({ page }) => {
    await openFixture(page, 'color-picker/matrix')

    await expect(picker(page, 'enabled').getByRole('option', { name: 'Primary' })).toHaveAttribute('aria-selected', 'true')
  })

  test('the palette is one tab stop walked with the arrows', async ({ page }) => {
    await openFixture(page, 'color-picker/matrix')
    const list = picker(page, 'enabled').getByRole('listbox', { name: 'Palette' })

    await list.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('value')).toHaveText('rgb(179, 38, 30)')
    await page.keyboard.press('Tab')
    await expect(list).not.toBeFocused()
  })

  test('the hue slider shows a focus ring', async ({ page }) => {
    await openFixture(page, 'color-picker/matrix')
    const hue = picker(page, 'enabled').getByRole('slider', { name: 'Hue' })

    // Reached by Tab, so the browser treats it as keyboard focus.
    await picker(page, 'enabled').getByRole('slider', { name: 'Brightness' }).focus()
    await page.keyboard.press('Tab')
    await expect(hue).toBeFocused()
    const style = await hue.evaluate(el => getComputedStyle(el).outlineStyle)
    expect(style).toBe('solid')
  })

  test('the 2-D field is two sliders, and the field shows their focus', async ({ page }) => {
    await openFixture(page, 'color-picker/matrix')
    const root = picker(page, 'enabled')

    await root.getByRole('slider', { name: 'Brightness' }).focus()
    await page.keyboard.press('PageDown')

    await expect(root.getByRole('slider', { name: 'Brightness' })).toHaveAttribute('aria-valuenow', /\d+/)
    expect(await root.locator('.ui-color-canvas').evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid')
  })

  test('the format list fits a narrow picker without breaking its words', async ({ page }) => {
    await openFixture(page, 'color-picker/stress')
    const format = picker(page, 'narrow').locator('.ui-color-picker__format')

    const box = (await format.boundingBox())!
    const column = (await picker(page, 'narrow').boundingBox())!
    expect(box.width).toBeLessThanOrEqual(column.width)
    await expect(format.getByRole('combobox')).toHaveValue('HEX')
  })

  test('an unreadable value says which forms it takes; Escape restores', async ({ page }) => {
    await openFixture(page, 'color-picker/matrix')
    const field = picker(page, 'alpha').getByRole('textbox', { name: 'Colour value' })

    await field.fill('#zz')
    await field.press('Enter')
    // Every field keeps an always-mounted alert region (the format list has one
    // too); the message lands in the value field's.
    await expect(picker(page, 'alpha').locator('.ui-color-edit').getByRole('alert')).toHaveText('Use #RRGGBB, rgb() or hsl()')

    await field.press('Escape')
    await expect(field).toHaveValue('#6750a480')
  })

  test('read-only takes focus but no change', async ({ page }) => {
    await openFixture(page, 'color-picker/matrix')
    const root = picker(page, 'readonly')

    await root.getByRole('slider', { name: 'Saturation' }).focus()
    await page.keyboard.press('Home')

    await expect(root.getByRole('slider', { name: 'Saturation' })).toBeFocused()
    await expect(root.getByRole('textbox', { name: 'Colour value' })).toHaveValue('#6750a4')
  })

  test('in RTL the hue spectrum runs with the slider', async ({ page }) => {
    await openFixture(page, 'color-picker/matrix', { dir: 'rtl' })
    const gradient = await picker(page, 'enabled').locator('.ui-color-picker__hue').evaluate(el => getComputedStyle(el).backgroundImage)

    expect(gradient).toContain('to left')
  })

  test('forced colors: the chosen swatch keeps a Highlight ring', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'color-picker/matrix')
    const chosen = picker(page, 'enabled').getByRole('option', { name: 'Primary' })

    expect(await chosen.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid')
  })
})
