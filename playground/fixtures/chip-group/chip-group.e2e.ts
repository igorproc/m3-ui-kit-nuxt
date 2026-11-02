import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

const chip = (page: Page, group: string, name: string) => page.getByTestId(group).getByRole('button', { name, exact: true })

test.describe('MChipGroup', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'chip-group/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'chip-group/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'chip-group/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('a group is one Tab stop, on its selected chip, and Tab comes back to the last focused chip', async ({ page }) => {
    await openFixture(page, 'chip-group/matrix')
    const stops = page.getByTestId('single').locator('[tabindex="0"]')

    await expect(stops).toHaveCount(1)
    await expect(stops).toHaveAccessibleName('Courier')

    await chip(page, 'single', 'Pickup').focus()
    await page.keyboard.press('Tab')
    await expect(chip(page, 'max', 'Cheese')).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(chip(page, 'single', 'Pickup')).toBeFocused()
  })

  for (const dir of DIRECTIONS) {
    test(`arrows walk a closed ring along the inline axis (${dir})`, async ({ page }) => {
      await openFixture(page, 'chip-group/matrix', { dir })
      const forward = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
      const backward = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'

      await chip(page, 'single', 'Courier').focus()
      await page.keyboard.press(forward)
      await expect(chip(page, 'single', 'Pickup')).toBeFocused()
      await page.keyboard.press('End')
      await expect(chip(page, 'single', 'Post')).toBeFocused()
      await page.keyboard.press(forward)
      await expect(chip(page, 'single', 'Courier')).toBeFocused()
      await page.keyboard.press(backward)
      await expect(chip(page, 'single', 'Post')).toBeFocused()
    })
  }

  test('a vertical group answers the block arrows', async ({ page }) => {
    await openFixture(page, 'chip-group/matrix')

    await chip(page, 'vertical', 'Newest').focus()
    await page.keyboard.press('ArrowDown')
    await expect(chip(page, 'vertical', 'Oldest')).toBeFocused()
    await page.keyboard.press('ArrowRight')
    await expect(chip(page, 'vertical', 'Oldest')).toBeFocused()
  })

  test('chips blocked by the max are announced unavailable and skipped by the arrows', async ({ page }) => {
    await openFixture(page, 'chip-group/matrix')

    await expect(chip(page, 'max', 'Mushrooms')).toHaveAttribute('aria-disabled', 'true')
    await chip(page, 'max', 'Olives').focus()
    await page.keyboard.press('ArrowRight')
    await expect(chip(page, 'max', 'Cheese')).toBeFocused()
  })

  test('a chip inserted in the middle is reached by the arrows in document order', async ({ page }) => {
    await openFixture(page, 'chip-group/matrix')

    await page.getByTestId('insert').click()
    await chip(page, 'order', 'First').focus()
    await page.keyboard.press('ArrowRight')
    await expect(chip(page, 'order', 'Inserted')).toBeFocused()
  })

  test('removing the focused chip hands focus on, and the last one leaves it on the row', async ({ page }) => {
    await openFixture(page, 'chip-group/matrix')
    const row = page.getByTestId('removable')

    await row.getByRole('button', { name: 'Remove Boris' }).focus()
    await page.keyboard.press('Enter')
    await expect(row.getByRole('button', { name: 'Remove Clara' })).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(row.getByRole('button', { name: 'Remove Anna' })).toBeFocused()

    await page.keyboard.press('Enter')
    await expect(row.getByRole('button')).toHaveCount(0)
    await expect(row).toBeFocused()
    await expect(row).toHaveAttribute('tabindex', '-1')

    await page.keyboard.press('Tab')
    await expect(row).not.toHaveAttribute('tabindex')
  })

  test('the field mode says the error in words and describes the row', async ({ page }) => {
    await openFixture(page, 'chip-group/matrix')
    const row = page.getByTestId('field-error')
    const line = page.locator('.ui-chip-group').filter({ has: row }).locator('.ui-chip-group__support')

    await expect(line).toHaveText('Pick at least one topic')
    await expect(row).toHaveAttribute('aria-invalid', 'true')
    await expect(row).toHaveAttribute('aria-describedby', (await line.getAttribute('id'))!)
  })

  test('the focus ring of the last chip is not clipped by the scrolling row', async ({ page }) => {
    await openFixture(page, 'chip-group/matrix')
    const row = page.getByTestId('scroll')

    await chip(page, 'scroll', 'Electronics and gadgets').focus()
    await page.keyboard.press('End')
    const last = chip(page, 'scroll', 'Books')
    await expect(last).toBeFocused()

    const fits = await last.evaluate((el) => {
      const style = getComputedStyle(el)
      const ring = Number.parseFloat(style.outlineWidth) + Number.parseFloat(style.outlineOffset)
      const box = el.getBoundingClientRect()
      const view = el.closest('[role="group"]')!.getBoundingClientRect()
      return box.right + ring <= view.right + 0.5 && box.left - ring >= view.left - 0.5
    })
    expect(fits).toBe(true)
    expect(await row.evaluate(el => el.scrollLeft)).toBeGreaterThan(0)
  })
})
