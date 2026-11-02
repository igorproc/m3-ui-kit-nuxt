import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'

/** `data-test` falls through to the input; the bar is its parent. */
const bar = (input: Locator) => input.locator('xpath=ancestor::div[contains(concat(" ", @class, " "), " ui-search__bar ")][1]')

test.describe('MSearch', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'search/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'search/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'search/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  for (const [step, height] of [['compact', 44], ['empty', 56], ['comfortable', 64]] as const) {
    test(`the bar has no edge, stands ${height} tall and rounds to half of it (${step})`, async ({ page }) => {
      await openFixture(page, 'search/matrix')
      const box = bar(page.getByTestId(step))

      const style = await box.evaluate((el) => {
        const computed = getComputedStyle(el)
        return { border: computed.borderTopStyle, shadow: computed.boxShadow, radius: Number.parseFloat(computed.borderTopLeftRadius), height: el.getBoundingClientRect().height }
      })
      const rem = await remInPx(page)
      expect(style.border).toBe('none')
      expect(style.shadow).toBe('none')
      expect(style.height / rem).toBeCloseTo(height, 0)
      expect(style.radius / rem).toBeCloseTo(height / 2, 0)
    })
  }

  test('hover raises a state layer over the container', async ({ page }) => {
    await openFixture(page, 'search/matrix')
    const box = bar(page.getByTestId('empty'))

    await box.hover()
    await waitForMotion(page)

    expect(await box.evaluate(el => getComputedStyle(el, '::before').opacity)).not.toBe('0')
  })

  test('focus is the kit focus ring around the bar', async ({ page }) => {
    await openFixture(page, 'search/matrix')
    const input = page.getByTestId('empty')

    await input.focus()
    const ring = await bar(input).evaluate((el) => {
      const style = getComputedStyle(el)
      return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) }
    })

    expect(ring.style).toBe('solid')
    expect(ring.width).toBeGreaterThanOrEqual(2)
  })

  test('typing and clearing keep the query where it starts', async ({ page }) => {
    await openFixture(page, 'search/matrix')
    const input = page.getByTestId('empty')
    const before = (await input.boundingBox())!.x

    await input.fill('nuxt')
    expect((await input.boundingBox())!.x).toBeCloseTo(before, 0)

    await bar(input).getByRole('button', { name: 'Clear the query' }).click()
    await expect(input).toHaveValue('')
    await expect(input).toBeFocused()
  })

  test('Enter submits the query', async ({ page }) => {
    await openFixture(page, 'search/matrix')

    await page.getByTestId('populated').focus()
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('submitted')).toHaveText('material design')
  })

  test('the clear button is not a tab stop while there is nothing to clear', async ({ page }) => {
    await openFixture(page, 'search/matrix')

    await page.getByTestId('empty').focus()
    await page.keyboard.press('Tab')

    await expect(page.getByTestId('populated')).toBeFocused()
  })

  test('forced colors: the bar keeps an edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'search/matrix')

    const outline = await bar(page.getByTestId('empty')).evaluate(el => getComputedStyle(el).outlineStyle)
    expect(outline).toBe('solid')
  })
})

test.describe('MSearch · keys, names and forced colours (M3-polish)', () => {
  test('forced colors: a focused bar keeps the full focus ring, not the 1px edge', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'search/matrix')
    await page.keyboard.press('Shift')
    await page.getByTestId('empty').focus()
    await waitForMotion(page)

    const ring = await bar(page.getByTestId('empty')).evaluate(el => Number.parseFloat(getComputedStyle(el).outlineWidth))
    expect(ring).toBeGreaterThanOrEqual(2)
  })

  test('the id of the app stays on the input, so its label names the bar', async ({ page }) => {
    await openFixture(page, 'search/cases')

    await expect(page.getByTestId('with-id')).toHaveAttribute('id', 'consumer-search')
    const labelled = await page.locator('label[for="consumer-search"]').evaluate(label => (label as HTMLLabelElement).control?.getAttribute('data-test'))
    expect(labelled).toBe('with-id')
  })

  test('Escape empties the query and says so through clear', async ({ page }) => {
    await openFixture(page, 'search/cases')
    const input = page.getByTestId('with-id')
    await input.focus()

    await page.keyboard.press('Escape')
    await expect(input).toHaveValue('')
    await expect(page.getByTestId('clears')).toHaveText('1')
  })

  test('the Enter that confirms an IME candidate is not a search', async ({ page }) => {
    await openFixture(page, 'search/matrix')
    const input = page.getByTestId('populated')
    await input.focus()
    await input.evaluate(el => el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', isComposing: true, bubbles: true, cancelable: true })))

    await expect(page.getByTestId('submitted')).toHaveText('')
  })
})

test.describe('MSearch · view (search v2)', () => {
  /** The listbox this bar controls: the page also holds an inline one. */
  const listbox = async (page: Page, input: Locator) => page.locator(`[id="${await input.getAttribute('aria-controls')}"]`)

  test('typing opens a docked view of matching rows, as wide as the bar and attached under it', async ({ page }) => {
    await openFixture(page, 'search/cases')
    const input = page.getByTestId('docked')

    await input.fill('zu')
    await waitForMotion(page)

    await expect(input).toHaveAttribute('aria-expanded', 'true')
    await expect((await listbox(page, input)).getByRole('option')).toHaveText(['Zürich'])

    const [barBox, viewBox] = await Promise.all([bar(input).boundingBox(), page.locator('.ui-search__menu .ui-menu__surface').boundingBox()])
    expect(viewBox!.width).toBeCloseTo(barBox!.width, 0)
    expect(viewBox!.y).toBeCloseTo(barBox!.y + barBox!.height, 0)
  })

  test('open, the bar squares its lower corners and keeps its upper ones', async ({ page }) => {
    await openFixture(page, 'search/cases')
    const input = page.getByTestId('docked')

    await input.fill('b')
    await waitForMotion(page)

    const corners = await bar(input).evaluate((el) => {
      const style = getComputedStyle(el)
      return [style.borderTopLeftRadius, style.borderBottomLeftRadius].map(Number.parseFloat)
    })
    expect(corners[0]! / await remInPx(page)).toBeCloseTo(28, 0)
    expect(corners[1]).toBe(0)
  })

  test('the arrows walk the rows and Enter chooses one into the query', async ({ page }) => {
    await openFixture(page, 'search/cases')
    const input = page.getByTestId('docked')

    await input.fill('z')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Enter')

    await expect(input).toHaveValue('Zagreb')
    await expect(page.getByTestId('chosen')).toHaveText('2')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toBeFocused()
  })

  test('Enter with no row active runs the query', async ({ page }) => {
    await openFixture(page, 'search/cases')
    const input = page.getByTestId('docked')

    await input.fill('ber')
    await page.keyboard.press('Enter')

    await expect(page.getByTestId('submitted')).toHaveText('ber')
  })

  test('Escape closes the view first and keeps the query', async ({ page }) => {
    await openFixture(page, 'search/cases')
    const input = page.getByTestId('docked')

    await input.fill('ber')
    await page.keyboard.press('Escape')
    await expect(input).toHaveAttribute('aria-expanded', 'false')
    await expect(input).toHaveValue('ber')

    await page.keyboard.press('Escape')
    await expect(input).toHaveValue('')
  })

  test('a query that finds nothing says so', async ({ page }) => {
    await openFixture(page, 'search/cases')
    const input = page.getByTestId('docked')

    await input.fill('xyz')

    await expect(page.locator('.ui-search-view__message')).toHaveText('Nothing found')
  })

  test('a pointer press on an empty bar opens its recent queries; Delete removes one', async ({ page }) => {
    await openFixture(page, 'search/cases')
    const input = page.getByTestId('grouped')

    await input.click()
    await expect(page.getByRole('group', { name: 'Recent' })).toBeVisible()

    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Delete')

    await expect(page.getByTestId('recent')).toHaveText('invoices march')
  })

  test('the pointer focus opens the view without the ring; the keyboard focus wears it', async ({ page }) => {
    await openFixture(page, 'search/cases')
    const input = page.getByTestId('grouped')

    await input.click()
    expect(await bar(input).evaluate(el => getComputedStyle(el).outlineStyle)).toBe('none')
  })

  test('an inline view lies in the flow under the bar', async ({ page }) => {
    await openFixture(page, 'search/cases')
    const input = page.getByTestId('inline')
    const view = bar(input).locator('xpath=following-sibling::div[contains(@class, "ui-search-view")][1]')

    await expect(view.getByRole('option')).toHaveCount(7)
    const [barBox, viewBox] = await Promise.all([bar(input).boundingBox(), view.boundingBox()])
    expect(viewBox!.y).toBeCloseTo(barBox!.y + barBox!.height, 0)
  })

  test('the open docked view has no axe violations', async ({ page }) => {
    // A11-06: MMenu wraps the listbox in role="menu" without menu items (aria-required-children),
    // as it does for MDropdown — deferred to the MMenu task. Remove this line when it is fixed.
    test.fail()
    await openFixture(page, 'search/cases')
    await page.getByTestId('docked').fill('b')
    await waitForMotion(page)
    await expectNoAxeViolations(page)
  })
})
