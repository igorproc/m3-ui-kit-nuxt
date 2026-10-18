import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'

test.describe('MTimePicker', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'time-picker/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'time-picker/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await openFixture(page, 'time-picker/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('selectors are 96 × 80, the dial 256, the handle 48', async ({ page }) => {
    await openFixture(page, 'time-picker/matrix')
    const picker = page.getByTestId('h23-evening')
    const unit = await remInPx(page)

    const selector = (await picker.locator('.ui-time-picker__selector').first().boundingBox())!
    expect([Math.round(selector.width / unit), Math.round(selector.height / unit)]).toEqual([96, 80])
    expect(Math.round((await picker.getByRole('slider').boundingBox())!.width / unit)).toBe(256)
    expect(Math.round((await picker.locator('.ui-time-picker__handle').boundingBox())!.width / unit)).toBe(48)
  })

  for (const dir of DIRECTIONS) {
    test(`a 24-hour picker keeps no period column: the time centres over the dial (${dir})`, async ({ page }) => {
      await openFixture(page, 'time-picker/matrix', { dir })
      const unit = await remInPx(page)
      const centre = async (part: Locator) => {
        const box = (await part.boundingBox())!
        return (box.x + box.width / 2) / unit
      }

      const dialPicker = page.getByTestId('h23-evening')
      await expect(dialPicker.locator('.ui-time-picker__period')).toHaveCount(0)
      expect(await centre(dialPicker.locator('.ui-time-picker__display'))).toBeCloseTo(await centre(dialPicker.getByRole('slider')), 0)
      expect(Math.round((await dialPicker.getByRole('slider').boundingBox())!.width / unit)).toBe(256)

      const typed = page.getByTestId('input-h23')
      expect(await centre(typed.locator('.ui-time-picker__display'))).toBeCloseTo(await centre(typed), 0)
    })
  }

  test('a 24-hour horizontal picker sets the time beside a full dial', async ({ page }) => {
    await openFixture(page, 'time-picker/matrix')
    const unit = await remInPx(page)
    const picker = page.getByTestId('horizontal-h23')
    const display = (await picker.locator('.ui-time-picker__display').boundingBox())!
    const dial = (await picker.getByRole('slider').boundingBox())!

    await expect(picker.locator('.ui-time-picker__period')).toHaveCount(0)
    expect(Math.round(dial.width / unit)).toBe(256)
    expect(display.x + display.width).toBeLessThanOrEqual(dial.x)
  })

  test('the chosen selector is a fill; focus adds the ring and moves nothing', async ({ page }) => {
    await openFixture(page, 'time-picker/matrix')
    const hours = page.getByTestId('h23-evening').getByRole('radio', { name: /^Hour/ })
    const before = (await hours.boundingBox())!

    expect(await hours.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('none')
    await hours.focus()
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowLeft')
    expect(await hours.evaluate(el => getComputedStyle(el).outlineStyle)).toBe('solid')
    expect((await hours.boundingBox())!.x).toBeCloseTo(before.x, 0)
  })

  test('arrows on the selectors switch the dial; the dial wraps past its top', async ({ page }) => {
    await openFixture(page, 'time-picker/matrix')
    const picker = page.getByTestId('h23-evening')

    await picker.getByRole('radio', { name: /^Hour/ }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(picker.getByRole('radio', { name: /^Minute/ })).toHaveAttribute('aria-checked', 'true')

    const dial = picker.getByRole('slider')
    await dial.focus()
    for (let step = 0; step < 15; step++) await page.keyboard.press('ArrowUp')
    await expect(dial).toHaveAttribute('aria-valuenow', '0')
  })

  test('a pointer hands over to minutes after the hour; the keyboard does not', async ({ page }) => {
    await openFixture(page, 'time-picker/matrix')
    const picker = page.getByTestId('h12-morning')
    const dial = picker.getByRole('slider')

    await dial.focus()
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(200)
    await expect(dial).toHaveAttribute('aria-label', 'Hour')

    const box = (await dial.boundingBox())!
    await page.mouse.click(box.x + box.width * 0.85, box.y + box.height / 2)
    await expect(picker.getByRole('radio', { name: /^Hour 03/ })).toBeVisible()
    await expect(dial).toHaveAttribute('aria-label', 'Minute')
  })

  test('dragging across the top turns the hand the short way', async ({ page }) => {
    await openFixture(page, 'time-picker/matrix')
    const picker = page.getByTestId('h23-evening')
    await picker.getByRole('radio', { name: /^Minute/ }).click()
    const dial = picker.getByRole('slider')
    const box = (await dial.boundingBox())!
    const centre = { x: box.x + box.width / 2, y: box.y + box.height / 2 }
    // On the outer ring, whatever a rem measures at this viewport.
    const radius = box.width * 0.4
    const at = (degrees: number) => ({
      x: centre.x + Math.sin(degrees * Math.PI / 180) * radius,
      y: centre.y - Math.cos(degrees * Math.PI / 180) * radius,
    })
    const turn = () => picker.locator('.ui-time-picker__hand').evaluate(el => Number.parseFloat(el.style.transform.replace(/[^\d.-]/g, '')))

    await page.mouse.move(at(330).x, at(330).y)
    await page.mouse.down()
    const start = await turn()
    await page.mouse.move(at(30).x, at(30).y, { steps: 6 })
    await page.mouse.up()

    expect(await turn() - start).toBeCloseTo(60, 0)
  })

  test('a typed hour of two digits moves on; a refused one shows an error', async ({ page }) => {
    await openFixture(page, 'time-picker/matrix')
    const picker = page.getByTestId('input-h23')
    const hour = picker.getByRole('textbox', { name: 'Hour' })

    await hour.fill('')
    await hour.pressSequentially('11')
    await expect(picker.getByRole('textbox', { name: 'Minute' })).toBeFocused()

    await hour.fill('75')
    await hour.press('Enter')
    await expect(picker.getByRole('alert')).toHaveText('Enter a valid hour')
    await expect(hour).toHaveAttribute('aria-invalid', 'true')
  })

  test('the period buttons never submit a form', async ({ page }) => {
    await openFixture(page, 'time-picker/matrix')
    const form = page.getByTestId('form')

    await form.getByRole('radio', { name: 'PM' }).click()
    await expect(page.getByTestId('submitted')).toHaveText('idle')
    await expect(form.locator('input[type="hidden"]')).toHaveValue('20:00')
  })

  test('horizontal sits side by side when it fits and folds when it does not', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 })
    await openFixture(page, 'time-picker/stress')

    const sideBySide = async (key: string) => {
      const picker = page.getByTestId(key)
      const display = (await picker.locator('.ui-time-picker__display').boundingBox())!
      const dial = (await picker.getByRole('slider').boundingBox())!
      return dial.x >= display.x + display.width
    }

    expect(await sideBySide('width-600')).toBe(true)
    expect(await sideBySide('width-360')).toBe(false)
    expect(await sideBySide('width-280')).toBe(false)
  })

  test('changing the cycle re-reads the same value', async ({ page }) => {
    await openFixture(page, 'time-picker/stress')
    const picker = page.getByTestId('cycle')

    await page.getByTestId('toggle-cycle').click()
    await expect(picker.getByRole('radio', { name: /^Hour 12/ })).toBeVisible()
    await expect(page.getByTestId('cycle-value')).toHaveText('00:30')
  })

  test('forced colors keep the hand and the chosen period visible', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'time-picker/matrix')
    const picker = page.getByTestId('h12-morning')

    for (const part of [picker.locator('.ui-time-picker__handle'), picker.getByRole('radio', { name: 'AM' })]) {
      expect(await part.evaluate(el => getComputedStyle(el).forcedColorAdjust)).toBe('none')
    }
  })

  test('the hand turns on the motion tokens and settles', async ({ page }) => {
    await openFixture(page, 'time-picker/matrix')
    const dial = page.getByTestId('h23-evening').getByRole('slider')

    await dial.focus()
    await page.keyboard.press('ArrowUp')
    await waitForMotion(page)
    await expect(dial).toHaveAttribute('aria-valuenow', '22')
  })
})
