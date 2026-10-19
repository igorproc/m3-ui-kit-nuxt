import { expect, test } from '@playwright/test'
import type { Locator } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture, remInPx, waitForMotion } from '../../e2e/support'

/** `data-test` falls through to the input; the bar is its parent. */
const bar = (input: Locator) => input.locator('xpath=ancestor::div[contains(@class, "ui-search")][1]')

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

  test('the bar is a full-shape container with no edge, 56 tall', async ({ page }) => {
    await openFixture(page, 'search/matrix')
    const box = bar(page.getByTestId('empty'))

    const style = await box.evaluate((el) => {
      const computed = getComputedStyle(el)
      return { border: computed.borderTopStyle, shadow: computed.boxShadow, height: el.getBoundingClientRect().height }
    })
    expect(style.border).toBe('none')
    expect(style.shadow).toBe('none')
    expect(style.height / await remInPx(page)).toBeCloseTo(56, 0)
  })

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

  test('typing and clearing never reflows the query', async ({ page }) => {
    await openFixture(page, 'search/matrix')
    const input = page.getByTestId('empty')
    const before = (await input.boundingBox())!.width

    await input.fill('nuxt')
    expect((await input.boundingBox())!.width).toBeCloseTo(before, 0)

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
