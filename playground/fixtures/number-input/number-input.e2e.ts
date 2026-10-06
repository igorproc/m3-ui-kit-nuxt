import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

/** The drawn edge of a field: the fieldset for outlined, the control's bottom border for filled. */
async function edgeColor(page: Page, testId: string) {
  return page.getByTestId(testId).evaluate((input) => {
    const root = input.closest('.ui-number-input')!
    const outline = root.querySelector('.ui-number-input__outline')
    return outline
      ? getComputedStyle(outline).borderTopColor
      : getComputedStyle(root.querySelector('.ui-number-input__control')!).borderBottomColor
  })
}

const valueOf = (page: Page, testId: string) => page.getByTestId(testId).getAttribute('aria-valuenow')

test.describe('MNumberInput', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'number-input/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'number-input/stress')
    await expectNoAxeViolations(page)
  })

  test('the open unit menu has no axe violations', async ({ page }) => {
    await openFixture(page, 'number-input/matrix')
    await page.getByRole('button', { name: /MiB/ }).click()
    await expect(page.getByRole('menuitemradio').first()).toBeFocused()
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'number-input/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('long labels and units truncate inside the field instead of squeezing the value out', async ({ page }) => {
    await openFixture(page, 'number-input/stress')

    for (const id of ['long-scrub', 'long-unit']) {
      const width = await page.getByTestId(id).evaluate(input => input.getBoundingClientRect().width)
      expect(width, id).toBeGreaterThan(40)
    }
  })

  test.describe('spinbutton keyboard model', () => {
    test('arrows step, Page keys jump ten steps, Home and End go to the bounds', async ({ page }) => {
      await openFixture(page, 'number-input/matrix')
      await page.getByTestId('keyboard').focus()

      await page.keyboard.press('ArrowUp')
      expect(await valueOf(page, 'keyboard')).toBe('11')
      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')
      expect(await valueOf(page, 'keyboard')).toBe('9')
      await page.keyboard.press('PageUp')
      expect(await valueOf(page, 'keyboard')).toBe('19')
      await page.keyboard.press('PageDown')
      expect(await valueOf(page, 'keyboard')).toBe('9')
      await page.keyboard.press('End')
      expect(await valueOf(page, 'keyboard')).toBe('100')
      await page.keyboard.press('Home')
      expect(await valueOf(page, 'keyboard')).toBe('0')
    })

    test('Enter commits a clamped value and still submits the form', async ({ page }) => {
      await openFixture(page, 'number-input/matrix')
      const field = page.getByTestId('keyboard')

      await field.fill('250')
      await field.press('Enter')

      await expect(field).toHaveValue('100')
      await expect(page.getByTestId('quantity')).toHaveText('100')
      await expect(page.getByTestId('submits')).toHaveText('1')
    })

    test('Escape reverts an edit, and is left to the page when there is none', async ({ page }) => {
      await openFixture(page, 'number-input/matrix')
      const field = page.getByTestId('keyboard')

      await field.fill('55')
      await field.press('Escape')
      await expect(field).toHaveValue('10')
      await expect(page.getByTestId('escapes')).toHaveText('0')

      await field.press('Escape')
      await expect(page.getByTestId('escapes')).toHaveText('1')
    })

    test('steppers are not tab stops; the unit trigger is', async ({ page }) => {
      await openFixture(page, 'number-input/matrix')
      await page.getByTestId('keyboard').focus()

      await page.keyboard.press('Tab')
      await expect(page.getByTestId('keyboard-next')).toBeFocused()

      await page.getByTestId('unit-menu').focus()
      await page.keyboard.press('Tab')
      await expect(page.getByRole('button', { name: 'Change unit MiB' })).toBeFocused()
    })
  })

  test.describe('unit menu', () => {
    test('opens from the keyboard, walks with arrows, picks with Enter and returns focus', async ({ page }) => {
      await openFixture(page, 'number-input/matrix')
      const trigger = page.getByRole('button', { name: 'Change unit MiB' })

      await trigger.focus()
      await page.keyboard.press('Enter')
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      await expect(page.getByRole('menuitemradio', { name: 'KiB' })).toBeFocused()

      await page.keyboard.press('ArrowDown')
      await page.keyboard.press('ArrowDown')
      await expect(page.getByRole('menuitemradio', { name: 'GiB' })).toBeFocused()
      await page.keyboard.press('Enter')

      await expect(page.getByTestId('unit-value')).toHaveText('GiB')
      await expect(page.getByRole('button', { name: 'Change unit GiB' })).toBeFocused()
    })

    test('closes on Escape and returns focus to the trigger', async ({ page }) => {
      await openFixture(page, 'number-input/matrix')
      const trigger = page.getByRole('button', { name: 'Change unit MiB' })

      await trigger.focus()
      await page.keyboard.press('Enter')
      await expect(page.getByRole('menuitemradio').first()).toBeFocused()
      await page.keyboard.press('Escape')

      await expect(trigger).toHaveAttribute('aria-expanded', 'false')
      await expect(trigger).toBeFocused()
    })

    test('the trigger shows a keyboard focus ring of at least 2px', async ({ page }) => {
      await openFixture(page, 'number-input/matrix')
      await page.getByTestId('unit-menu').focus()
      await page.keyboard.press('Tab')

      const width = await page.evaluate(() => Number.parseFloat(getComputedStyle(document.activeElement!).outlineWidth))
      expect(width).toBeGreaterThanOrEqual(2)
    })
  })

  test.describe('focus visibility', () => {
    for (const state of ['populated', 'error', 'readonly']) {
      for (const variant of ['filled-split', 'outlined-split']) {
        test(`focus changes the edge of a ${state} ${variant} field`, async ({ page }) => {
          await openFixture(page, 'number-input/matrix')
          const id = `${state}-${variant}`
          const rest = await edgeColor(page, id)

          await page.getByTestId(id).focus()

          await expect.poll(() => edgeColor(page, id)).not.toBe(rest)
        })
      }
    }
  })

  test('the support line is a live region before any error arrives', async ({ page }) => {
    await openFixture(page, 'number-input/matrix')

    const region = page.getByTestId('empty-filled-split')
    const describedRegion = await region.evaluate(input => input.closest('.ui-number-input')!
      .querySelector('.ui-number-input__support')!.getAttribute('role'))
    expect(describedRegion).toBe('alert')
  })

  test('an error without a message still shows a non-colour cue', async ({ page }) => {
    await openFixture(page, 'number-input/matrix')

    const icon = await page.getByTestId('bare-error-filled-split').evaluate(input => Boolean(input.closest('.ui-number-input')!
      .querySelector('.ui-number-input__support-icon')))
    expect(icon).toBe(true)
  })

  test('the overlaid label sits at the inline start in RTL', async ({ page }) => {
    await openFixture(page, 'number-input/matrix', { dir: 'rtl' })

    const [label, control] = await page.getByTestId('populated-outlined-none').evaluate((input) => {
      const root = input.closest('.ui-number-input')!
      return [
        root.querySelector('.ui-number-input__label')!.getBoundingClientRect(),
        root.querySelector('.ui-number-input__control')!.getBoundingClientRect(),
      ].map(rect => ({ left: rect.left, right: rect.right }))
    })

    expect(control!.right - label!.right).toBeLessThan(label!.left - control!.left)
  })

  test.describe('forced colors', () => {
    test.beforeEach(async ({ page }) => {
      await page.emulateMedia({ forcedColors: 'active' })
    })

    test('stepper zones keep a visible edge', async ({ page }) => {
      await openFixture(page, 'number-input/matrix')

      for (const id of ['populated-filled-split', 'populated-outlined-stacked', 'disabled-filled-split']) {
        const styles = await page.getByTestId(id).evaluate(input => [...input.closest('.ui-number-input')!
          .querySelectorAll('.ui-number-input__stepper')].map(stepper => getComputedStyle(stepper).borderTopStyle))
        expect(styles.length, id).toBe(2)
        for (const style of styles) expect(style, id).not.toBe('none')
      }
    })

    test('focus changes the edge of a read-only field', async ({ page }) => {
      await openFixture(page, 'number-input/matrix')
      const id = 'readonly-outlined-split'
      const rest = await edgeColor(page, id)

      await page.getByTestId(id).focus()

      await expect.poll(() => edgeColor(page, id)).not.toBe(rest)
    })
  })
})
