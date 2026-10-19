import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'

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

  test('the hue slider takes keyboard focus; the ring circles the thumb, not the whole target', async ({ page }) => {
    await openFixture(page, 'color-picker/matrix')
    const hue = picker(page, 'enabled').getByRole('slider', { name: 'Hue' })

    // Reached by Tab, so the browser treats it as keyboard focus.
    await picker(page, 'enabled').getByRole('slider', { name: 'Brightness' }).focus()
    await page.keyboard.press('Tab')
    await expect(hue).toBeFocused()
    expect(await hue.evaluate(el => el.matches(':focus-visible'))).toBe(true)
    expect(await hue.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('none')
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
    // The value field's support line appears with its error (decision 2026-10-19);
    // the message lands in its alert region.
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

    // A production build minifies `to left` into the same angle.
    expect(gradient).toMatch(/to left|270deg/)
  })

  test('forced colors: the chosen swatch keeps a Highlight ring', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'color-picker/matrix')
    const chosen = picker(page, 'enabled').getByRole('option', { name: 'Primary' })

    expect(await chosen.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid')
  })

  test('four channels keep their values whole', async ({ page }) => {
    await openFixture(page, 'color-picker/matrix')
    const root = picker(page, 'enabled')

    await root.getByRole('combobox', { name: 'Format' }).focus()
    await page.keyboard.press('ArrowDown')
    await page.getByRole('option', { name: 'RGBA', exact: true }).click()
    const channels = root.locator('.ui-color-edit__channels input')
    await expect(channels).toHaveCount(4)
    for (const channel of await channels.all()) {
      expect(await channel.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0)
    }
  })

  test('the hue and alpha targets do not overlap, so each keeps its whole 40', async ({ page }) => {
    await openFixture(page, 'color-picker/matrix')
    const unit = await remInPx(page)
    const hue = (await picker(page, 'alpha').locator('.ui-color-picker__hue').boundingBox())!
    const alpha = (await picker(page, 'alpha').locator('.ui-color-picker__alpha').boundingBox())!

    expect(alpha.y).toBeGreaterThanOrEqual(hue.y + hue.height - 0.5)
    expect(hue.height / unit).toBeCloseTo(40, 0)
  })

  test('a focused chosen swatch shows the focus ring and its selection ring', async ({ page }) => {
    await openFixture(page, 'color-picker/matrix')
    await page.keyboard.press('Shift')
    await picker(page, 'enabled').locator('.ui-color-swatches').focus()
    const chosen = picker(page, 'enabled').getByRole('option', { name: 'Primary' })

    expect(await chosen.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid')
    expect(await chosen.evaluate(el => getComputedStyle(el).boxShadow)).not.toBe('none')
  })

  test('swatches do not lift under the pointer while read-only or disabled', async ({ page }) => {
    await openFixture(page, 'color-picker/matrix')
    for (const id of ['readonly', 'disabled']) {
      const swatch = picker(page, id).getByRole('option', { name: 'Error' })
      await swatch.hover({ force: true })
      await waitForMotion(page)
      expect(await swatch.evaluate(el => getComputedStyle(el).transform)).toBe('none')
    }
  })

  test('preview and format share a row; the hex value, whole, beside them or under them', async ({ page }) => {
    await openFixture(page, 'color-picker/matrix')
    const root = picker(page, 'readonly')
    const top = async (selector: string) => (await root.locator(selector).first().boundingBox())!.y

    const row = await top('.ui-color-picker__value-row')
    expect(await top('.ui-color-preview')).toBeCloseTo(row, 0)
    expect(await top('.ui-color-picker__format')).toBeCloseTo(row, 0)
    expect(await root.locator('.ui-color-edit input').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0)
    expect(await root.locator('.ui-color-picker__format input').evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0)
  })

  test('in a narrow picker the hex value wraps under the format rather than being cut', async ({ page }) => {
    await openFixture(page, 'color-picker/stress')
    const value = picker(page, 'narrow').locator('.ui-color-edit input')

    expect(await value.evaluate(el => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(0)
  })
})
