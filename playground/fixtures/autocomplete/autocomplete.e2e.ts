import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'
import { DIRECTIONS, THEMES, WIDTHS, expectNoAxeViolations, expectNoHorizontalOverflow, openFixture } from '../../e2e/support'

/** See dropdown.e2e.ts: MMenu's role="menu" surface around the listbox. */
const KNOWN_MENU_VIOLATION = ['aria-required-children: .ui-menu__surface']

async function openPanelViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .exclude('nuxt-devtools-frame')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze()
  return violations.flatMap(v => v.nodes.map(node => `${v.id}: ${node.target.join(' ')}`))
}

/** `data-test` falls through to the combobox input. */
const combobox = (page: Page, id: string) => page.getByTestId(id)
const listbox = (page: Page) => page.getByRole('listbox')
const activeOption = (page: Page, id: string) => combobox(page, id).evaluate((el) => {
  const target = el.getAttribute('aria-activedescendant')
  return target ? document.getElementById(target)?.textContent?.trim() ?? null : null
})
const outline = (locator: Locator) => locator.evaluate((el) => {
  const style = getComputedStyle(el)
  return { style: style.outlineStyle, width: Number.parseFloat(style.outlineWidth) }
})

test.describe('MAutocomplete', () => {
  for (const theme of THEMES) {
    for (const dir of DIRECTIONS) {
      test(`matrix has no axe violations (${theme}, ${dir})`, async ({ page }) => {
        await openFixture(page, 'autocomplete/matrix', { theme, dir })
        await expectNoAxeViolations(page)
      })
    }
  }

  for (const [fixture, id] of [['matrix', 'selected-filled'], ['stress', 'loading'], ['stress', 'empty']] as const) {
    for (const theme of THEMES) {
      test(`an open ${id} panel has no axe violations of its own (${theme})`, async ({ page }) => {
        await openFixture(page, `autocomplete/${fixture}`, { theme })
        await combobox(page, id).focus()
        await expect(combobox(page, id)).toHaveAttribute('aria-expanded', 'true')
        expect(await openPanelViolations(page)).toEqual(KNOWN_MENU_VIOLATION)
      })
    }
  }

  test('stress content has no axe violations', async ({ page }) => {
    await openFixture(page, 'autocomplete/stress')
    await expectNoAxeViolations(page)
  })

  for (const width of WIDTHS) {
    test(`stress content does not overflow the page at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 })
      await openFixture(page, 'autocomplete/stress')
      await expectNoHorizontalOverflow(page)
    })
  }

  test('a panel of long rows scrolls only vertically', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 })
    await openFixture(page, 'autocomplete/stress')
    await combobox(page, 'long').focus()
    await page.keyboard.press('Control+A')
    await page.keyboard.press('Delete')

    await expect(listbox(page).getByRole('option')).toHaveCount(3)
    const overflow = await listbox(page).evaluate(el => el.scrollWidth - el.clientWidth)
    expect(overflow).toBeLessThanOrEqual(0)
    await expectNoHorizontalOverflow(page)
  })

  test('the toggle is not a tab stop: Tab goes field to field', async ({ page }) => {
    await openFixture(page, 'autocomplete/matrix')
    await combobox(page, 'enabled-filled').focus()

    await page.keyboard.press('Tab')
    await expect(combobox(page, 'enabled-outlined')).toBeFocused()
    await expect(combobox(page, 'enabled-filled')).toHaveAttribute('aria-expanded', 'false')
  })

  test('typing filters, the arrows walk, Enter commits the title', async ({ page }) => {
    await openFixture(page, 'autocomplete/matrix')
    const field = combobox(page, 'enabled-filled')
    await field.focus()

    await page.keyboard.type('ber')
    await expect(listbox(page).getByRole('option')).toHaveText([/Berlin/, /Bern/])

    await page.keyboard.press('ArrowDown')
    await expect.poll(() => activeOption(page, 'enabled-filled')).toBe('Berlin')
    await page.keyboard.press('Enter')

    await expect(field).toHaveValue('Berlin')
    await expect(field).toHaveAttribute('aria-expanded', 'false')
    await expect(field).toBeFocused()
  })

  test('Home and End stay with the caret', async ({ page }) => {
    await openFixture(page, 'autocomplete/matrix')
    const field = combobox(page, 'enabled-filled')
    await field.focus()
    await page.keyboard.type('dub')

    await page.keyboard.press('Home')
    expect(await field.evaluate(el => (el as HTMLInputElement).selectionStart)).toBe(0)
    await page.keyboard.press('End')
    expect(await field.evaluate(el => (el as HTMLInputElement).selectionStart)).toBe(3)
  })

  test('Escape puts the committed value back over an abandoned draft', async ({ page }) => {
    await openFixture(page, 'autocomplete/matrix')
    const field = combobox(page, 'selected-filled')
    await field.focus()
    await page.keyboard.press('Control+A')
    await page.keyboard.type('Cop')

    await page.keyboard.press('Escape')
    await expect(field).toHaveValue('Berlin')
    await expect(field).toBeFocused()
  })

  test('below the minimum length the panel stays closed', async ({ page }) => {
    await openFixture(page, 'autocomplete/matrix')
    const field = combobox(page, 'min-length-filled')
    await field.focus()
    await expect(field).toHaveAttribute('aria-expanded', 'false')

    await page.keyboard.type('a')
    await expect(field).toHaveAttribute('aria-expanded', 'false')
    await page.keyboard.type('m')
    await expect(field).toHaveAttribute('aria-expanded', 'true')
  })

  test('no results is announced through a region that existed before', async ({ page }) => {
    await openFixture(page, 'autocomplete/matrix')
    const field = combobox(page, 'enabled-filled')
    const region = page.locator('.ui-autocomplete__status').first()

    await expect(region).toHaveText('')
    await field.focus()
    await page.keyboard.type('zzz')
    await expect(region).toHaveText('No results')
  })

  test('the keyboard cursor is a focus ring, and selection is not colour alone', async ({ page }) => {
    await openFixture(page, 'autocomplete/matrix')
    await combobox(page, 'selected-filled').focus()
    await page.keyboard.press('ArrowDown')

    const active = page.locator('.ui-autocomplete__option--active')
    expect((await outline(active)).style).toBe('solid')
    expect((await outline(active)).width).toBeGreaterThanOrEqual(2)
    await expect(page.locator('.ui-list-item--selected .ui-autocomplete__check')).toHaveCount(1)
  })

  test('forced colors: the keyboard cursor stays visible', async ({ page }) => {
    await page.emulateMedia({ forcedColors: 'active' })
    await openFixture(page, 'autocomplete/matrix')
    await combobox(page, 'enabled-filled').focus()
    await page.keyboard.press('ArrowDown')

    const ring = await outline(page.locator('.ui-autocomplete__option--active'))
    expect(ring.style).toBe('solid')
    expect(ring.width).toBeGreaterThanOrEqual(2)
  })
})
