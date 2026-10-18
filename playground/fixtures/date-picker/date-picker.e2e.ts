import { expect, test } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'

test.describe('MDatePicker', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'date-picker/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'date-picker/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await openFixture(page, 'date-picker/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('a narrow picker keeps its week inside the card', async ({ page }) => {
    await openFixture(page, 'date-picker/stress')
    const grid = page.getByTestId('narrow').getByRole('grid')

    const overflow = await grid.evaluate(el => el.scrollWidth - el.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })

  test('paging from a four-week month to a six-week one keeps the height', async ({ page }) => {
    await openFixture(page, 'date-picker/stress')
    const picker = page.getByTestId('short-month')
    const before = (await picker.boundingBox())!.height

    for (let step = 0; step < 3; step++) await picker.getByRole('button', { name: 'Next month' }).click()
    await expect(picker.locator('.ui-date-picker__view-toggle')).toContainText('May 2026')
    expect((await picker.boundingBox())!.height).toBeCloseTo(before, 0)
  })

  test('the day is a 40 circle inside a 48 target', async ({ page }) => {
    await openFixture(page, 'date-picker/matrix')
    const day = page.getByTestId('selected').getByRole('gridcell', { name: 'Wednesday, October 14, 2026' })

    const unit = await remInPx(page)
    const box = (await day.boundingBox())!
    expect(box.width / unit).toBeCloseTo(40, 0)
    expect(box.height / unit).toBeCloseTo(40, 0)
    expect(await day.evaluate(el => getComputedStyle(el).borderRadius)).not.toBe('0px')
  })

  test('arrows move the focus between days, Enter chooses', async ({ page }) => {
    await openFixture(page, 'date-picker/matrix')
    const picker = page.getByTestId('selected')
    const chosen = picker.getByRole('gridcell', { name: 'Wednesday, October 14, 2026' })

    await chosen.focus()
    await page.keyboard.press('ArrowDown')
    const next = picker.getByRole('gridcell', { name: 'Wednesday, October 21, 2026' })
    await expect(next).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(next).toHaveAttribute('aria-selected', 'true')
    await expect(picker.locator('.ui-date-picker__headline')).toHaveText('Oct 21, 2026')
  })

  test('arrows mirror in a right-to-left page', async ({ page }) => {
    await openFixture(page, 'date-picker/matrix', { dir: 'rtl' })
    const picker = page.getByTestId('selected')

    await picker.getByRole('gridcell', { name: 'Wednesday, October 14, 2026' }).focus()
    await page.keyboard.press('ArrowLeft')
    await expect(picker.getByRole('gridcell', { name: 'Thursday, October 15, 2026' })).toBeFocused()
  })

  test('the month toggle opens the years, focused on the shown one; picking returns to the days', async ({ page }) => {
    await openFixture(page, 'date-picker/matrix')
    const picker = page.getByTestId('selected')
    const toggle = picker.locator('.ui-date-picker__view-toggle')

    await toggle.click()
    await waitForMotion(page)
    await expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await expect(picker.getByRole('gridcell', { name: '2026' })).toBeFocused()

    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('Enter')
    await waitForMotion(page)

    await expect(toggle).toContainText('October 2027')
    await expect(picker.getByRole('gridcell', { name: /October 14, 2027/ })).toBeFocused()
  })

  test('a typed date is read on Enter and becomes the headline', async ({ page }) => {
    await openFixture(page, 'date-picker/matrix')
    const picker = page.getByTestId('typed')
    const input = picker.getByRole('textbox')

    await input.fill('12/25/2026')
    await input.press('Enter')
    await expect(picker.locator('.ui-date-picker__headline')).toHaveText('Dec 25, 2026')
  })

  test('unavailable days take focus but no choice', async ({ page }) => {
    await openFixture(page, 'date-picker/matrix')
    const picker = page.getByTestId('bounded')
    const early = picker.getByRole('gridcell', { name: 'Friday, October 9, 2026' })

    // `aria-disabled` reads as "not enabled" to Playwright, which then refuses
    // to click; a person can still press it, and nothing must be chosen.
    await early.click({ force: true })
    await expect(early).toBeFocused()
    await expect(early).toHaveAttribute('aria-disabled', 'true')
    await expect(picker.locator('.ui-date-picker__headline')).toHaveText('Oct 14, 2026')
  })

  test('the dialog edits a draft: Escape cancels, OK commits, focus comes home', async ({ page }) => {
    await openFixture(page, 'date-picker/matrix')
    const trigger = page.getByTestId('open-dialog')
    const dialog = page.getByRole('dialog')

    await trigger.click()
    await waitForMotion(page)
    await expect(dialog.getByRole('gridcell', { name: 'Wednesday, October 14, 2026' })).toBeFocused()

    await dialog.getByRole('gridcell', { name: 'Friday, October 16, 2026' }).click()
    await page.keyboard.press('Escape')
    await waitForMotion(page)
    await expect(page.getByTestId('dialog-outcome')).toHaveText('cancelled')
    await expect(page.getByTestId('dialog-value')).toHaveText('Wed Oct 14 2026')
    await expect(trigger).toBeFocused()

    await trigger.click()
    await waitForMotion(page)
    await dialog.getByRole('gridcell', { name: 'Friday, October 16, 2026' }).click()
    await dialog.getByRole('button', { name: 'OK' }).click()
    await waitForMotion(page)
    await expect(page.getByTestId('dialog-outcome')).toHaveText('confirmed')
    await expect(page.getByTestId('dialog-value')).toHaveText('Fri Oct 16 2026')
  })

  test('OK keeps the dialog open on a refused typed date', async ({ page }) => {
    await openFixture(page, 'date-picker/matrix')
    await page.getByTestId('open-dialog').click()
    const dialog = page.getByRole('dialog')

    await dialog.getByRole('button', { name: 'Switch to text input mode' }).click()
    await dialog.getByRole('textbox').fill('13/45/2026')
    await dialog.getByRole('button', { name: 'OK' }).click()

    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('alert')).not.toBeEmpty()
  })

  test('the dialog has no axe violations while open', async ({ page }) => {
    await openFixture(page, 'date-picker/matrix')
    await page.getByTestId('open-dialog').click()
    await waitForMotion(page)
    await expectNoAxeViolations(page)
  })
})
