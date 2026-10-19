import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx } from '../../e2e/support'

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

    test('the chosen unit is marked by a check, not by colour alone', async ({ page }) => {
      await openFixture(page, 'number-input/matrix')
      await page.getByRole('button', { name: 'Change unit MiB' }).click()

      const chosen = page.getByRole('menuitemradio', { name: 'MiB' })
      await expect(chosen).toHaveAttribute('aria-checked', 'true')
      await expect(chosen.locator('.ui-number-input__unit-check')).toBeVisible()
      await expect(page.getByRole('menuitemradio', { name: 'KiB' }).locator('.ui-number-input__unit-check')).toHaveCount(0)
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

  test('the alert region is mounted before any error arrives, and the helper stays outside it', async ({ page }) => {
    await openFixture(page, 'number-input/matrix')

    // A field with nothing to say has no line at all (decision 2026-10-19); one with a
    // bound error and no message keeps an empty region.
    const [emptyAlert, helperAlert, helperSupport, errorAlert] = await Promise.all([
      page.getByTestId('bare-error-filled-split').evaluate(input => input.closest('.ui-number-input')!.querySelector('[role="alert"]')?.textContent?.trim()),
      page.getByTestId('populated-filled-split').evaluate(input => input.closest('.ui-number-input')!.querySelector('[role="alert"]')?.textContent?.trim()),
      page.getByTestId('populated-filled-split').evaluate(input => input.closest('.ui-number-input')!.querySelector('.ui-number-input__support')!.textContent?.trim()),
      page.getByTestId('error-filled-split').evaluate(input => input.closest('.ui-number-input')!.querySelector('[role="alert"]')?.textContent?.trim()),
    ])

    expect(emptyAlert).toBe('')
    expect(helperAlert).toBe('')
    expect(helperSupport).toBe('Helper')
    expect(errorAlert).toBe('Too large')
  })

  for (const density of ['compact', 'default', 'comfortable']) {
    test(`a filled field is as tall as a text field of the same density (${density})`, async ({ page }) => {
      await openFixture(page, 'number-input/matrix')
      const height = (id: string) => page.getByTestId(id).evaluate(input =>
        input.closest('.ui-number-input, .ui-text-field')!.querySelector('[class$="__control"]')!.getBoundingClientRect().height)

      const text = await height(`family-text-${density}`)
      expect(await height(`family-number-${density}`)).toBeCloseTo(text, 0)
      expect(await height(`family-stacked-${density}`)).toBeCloseTo(text, 0)
    })

    test(`the stacked column stays inside a filled box (${density})`, async ({ page }) => {
      await openFixture(page, 'number-input/matrix')
      const [column, control] = await page.getByTestId(`family-stacked-${density}`).evaluate((input) => {
        const root = input.closest('.ui-number-input')!
        return [root.querySelector('.ui-number-input__stacked')!, root.querySelector('.ui-number-input__control')!]
          .map(el => el.getBoundingClientRect()).map(rect => ({ top: rect.top, bottom: rect.bottom }))
      })

      expect(column!.top).toBeGreaterThanOrEqual(control!.top)
      expect(column!.bottom).toBeLessThanOrEqual(control!.bottom)
    })
  }

  test('the scrub handle and the value share one line in a filled field', async ({ page }) => {
    await openFixture(page, 'number-input/matrix')
    const [handle, value] = await page.getByTestId('populated-filled-scrub').evaluate((input) => {
      const root = input.closest('.ui-number-input')!
      return [root.querySelector('.ui-number-input__scrub')!, input]
        .map(el => el.getBoundingClientRect()).map(rect => rect.top + rect.height / 2)
    })

    expect(Math.abs(handle! - value!)).toBeLessThanOrEqual(1)
  })

  test('outlined has no surface when disabled', async ({ page }) => {
    await openFixture(page, 'number-input/matrix')
    const surface = await page.getByTestId('disabled-outlined-none').evaluate(input =>
      getComputedStyle(input.closest('.ui-number-input')!.querySelector('.ui-number-input__control')!).backgroundColor)

    expect(surface).toBe('rgba(0, 0, 0, 0)')
  })

  test('a zone at its bound recedes its tone, not only its glyph', async ({ page }) => {
    await openFixture(page, 'number-input/matrix')
    const [increment, decrement] = await page.getByTestId('error-outlined-split').evaluate(input => ['increment', 'decrement']
      .map(side => getComputedStyle(input.closest('.ui-number-input')!.querySelector(`.ui-number-input__stepper--${side}`)!).backgroundColor))

    expect(increment).not.toBe(decrement)
  })

  test('the support line is one body-small line high', async ({ page }) => {
    await openFixture(page, 'number-input/matrix')
    const height = await page.getByTestId('populated-outlined-split').evaluate(input =>
      input.closest('.ui-number-input')!.querySelector('.ui-number-input__support')!.getBoundingClientRect().height)

    expect(height / await remInPx(page)).toBeCloseTo(16, 0)
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

  // Rects of the field's parts relative to its control, in rem.
  const parts = (page: Page, testId: string) => page.getByTestId(testId).evaluate((input) => {
    const rem = Number.parseFloat(getComputedStyle(document.documentElement).fontSize)
    const root = input.closest('.ui-number-input')!
    const box = root.querySelector('.ui-number-input__control')!.getBoundingClientRect()
    const place = (element: Element | null) => {
      if (!element) return null
      const rect = element.getBoundingClientRect()
      return { top: (rect.top - box.top) / rem, bottom: (rect.bottom - box.top) / rem, start: (rect.left - box.left) / rem, height: rect.height / rem }
    }
    const style = getComputedStyle(input)
    const valueTop = input.getBoundingClientRect().top + Number.parseFloat(style.paddingTop)
    const valueBottom = input.getBoundingClientRect().bottom - Number.parseFloat(style.paddingBottom)
    return {
      boxBottom: box.height / rem,
      valueCentre: ((valueTop + valueBottom) / 2 - box.top) / rem,
      valueStart: (input.getBoundingClientRect().left - box.left) / rem,
      label: place(root.querySelector('.ui-number-input__label')),
      unit: place(root.querySelector('.ui-number-input__unit')),
      column: place(root.querySelector('.ui-number-input__stacked')),
      halves: [...root.querySelectorAll('.ui-number-input__stacked .ui-number-input__stepper')].map(place),
      support: place(root.querySelector('.ui-number-input__support')),
    }
  })

  for (const id of ['family-stacked-compact', 'family-stacked-default', 'family-stacked-comfortable', 'populated-outlined-stacked']) {
    test(`the stacked halves split their column, none squashed (${id})`, async ({ page }) => {
      await openFixture(page, 'number-input/matrix')
      const { column, halves } = await parts(page, id)

      for (const half of halves) expect(half!.height).toBeGreaterThan(column!.height / 2 - 1)
    })
  }

  test('the unit sits on the line of the digits', async ({ page }) => {
    await openFixture(page, 'number-input/matrix')

    for (const id of ['unit-static', 'unit-menu']) {
      const { unit, valueCentre } = await parts(page, id)
      expect((unit!.top + unit!.bottom) / 2, id).toBeCloseTo(valueCentre, 0)
    }
  })

  test('a raised label sits on the value and the support line starts 4 below the box', async ({ page }) => {
    await openFixture(page, 'number-input/matrix')
    const { label, support, boxBottom } = await parts(page, 'populated-filled-split')

    expect((label!.top + label!.bottom) / 2).toBeCloseTo(15, 0)
    expect(support!.top - boxBottom).toBeCloseTo(4, 0)
  })

  test('beside a prepend the overlaid label starts where the value does', async ({ page }) => {
    await openFixture(page, 'text-field/family')
    const { label, valueStart } = await parts(page, 'ni-prepend-filled-none')

    // Within the box's edge: the label is placed from the outer edge, the value from inside its hairline.
    expect(Math.abs(label!.start - valueStart)).toBeLessThanOrEqual(2)
  })

  test('a read-only field shows focus in its label too', async ({ page }) => {
    await openFixture(page, 'number-input/matrix')
    const ink = () => page.getByTestId('readonly-filled-split').evaluate(input =>
      getComputedStyle(input.closest('.ui-number-input')!.querySelector('.ui-number-input__label')!).color)
    const rest = await ink()

    await page.getByTestId('readonly-filled-split').focus()
    await expect.poll(ink).not.toBe(rest)
  })

  test('a press on the box focuses the field', async ({ page }) => {
    await openFixture(page, 'text-field/family')
    const input = page.getByTestId('ni-prepend-outlined-none')
    const box = (await input.evaluate(el => el.closest('.ui-number-input')!.querySelector('.ui-number-input__control')!.getBoundingClientRect().toJSON()))
    await page.mouse.click(box.x + box.width - 4, box.y + 4)

    await expect(input).toBeFocused()
  })

  for (const dir of DIRECTIONS) {
    test(`dragging the scrub towards the line's end increases the value (${dir})`, async ({ page }) => {
      await openFixture(page, 'number-input/matrix', { dir })
      const handle = page.getByTestId('populated-filled-scrub').locator('xpath=ancestor::div[contains(@class, "ui-number-input ")][1]').locator('.ui-number-input__scrub')
      const box = (await handle.boundingBox())!
      const towardsEnd = dir === 'rtl' ? -1 : 1

      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
      await page.mouse.down()
      for (let step = 1; step <= 10; step++) await page.mouse.move(box.x + box.width / 2 + towardsEnd * step * 4, box.y + box.height / 2)
      await page.mouse.up()

      expect(Number(await valueOf(page, 'populated-filled-scrub'))).toBeGreaterThan(42)
    })
  }

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
